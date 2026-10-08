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
 *  - Modal de contacto inteligente (Gmail directo, Mailto, Copiar email)
 *  - Copiar email al portapapeles a prueba de fallos (file:// y https://)
 *  - Toast de confirmación flotante
 *  - Año actual dinámico para el copyright
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  const EMAIL_CONTACT = 'Thiagopgnqn@gmail.com';

  // ------------------------------------------------------------------------
  // 1. SELECTORES PRINCIPALES
  // ------------------------------------------------------------------------
  const progressBar = document.getElementById('scroll-progress-bar');
  const header = document.getElementById('header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const revealElements = document.querySelectorAll('.reveal');
  const currentYearSpan = document.getElementById('current-year');
  const toastNotification = document.getElementById('toast-notification');

  // Selectores del Modal de Contacto
  const contactModal = document.getElementById('contact-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalServiceName = document.getElementById('modal-service-name');
  const modalBtnGmail = document.getElementById('modal-btn-gmail');
  const modalBtnMailto = document.getElementById('modal-btn-mailto');
  const modalBtnCopy = document.getElementById('modal-btn-copy');
  const modalCopyBadge = document.getElementById('modal-copy-badge');
  const modalCopyTitle = document.getElementById('modal-copy-title');

  // Formulario dentro del modal
  const modalComposerForm = document.getElementById('modal-composer-form');
  const compNameInput = document.getElementById('comp-name');
  const compTypeSelect = document.getElementById('comp-type');
  const compDetailsTextarea = document.getElementById('comp-details');
  const composerSubmitGmail = document.getElementById('composer-submit-gmail');
  const composerSubmitMail = document.getElementById('composer-submit-mail');

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

    if (progressBar && scrollHeight > 0) {
      const progressPercent = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      progressBar.style.width = `${progressPercent}%`;
    }

    if (header) {
      if (scrollTop > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }
  };

  window.addEventListener('scroll', handleScrollUpdates, { passive: true });
  handleScrollUpdates();

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
        document.body.style.overflow = 'hidden';
      } else {
        mainNav.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    };

    mobileToggle.addEventListener('click', () => toggleMenu());

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (mainNav.classList.contains('is-open')) {
          toggleMenu(false);
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        toggleMenu(false);
        mobileToggle.focus();
      }
    });

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
  // ------------------------------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1,
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  // ------------------------------------------------------------------------
  // 6. DETECCIÓN DE SECCIÓN ACTIVA EN MENÚ
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
  // 7. SISTEMA DE COPIADO AL PORTAPAPELES (A PRUEBA DE FALLOS)
  //    Soporta file://, http://, https:// y todos los navegadores
  // ------------------------------------------------------------------------
  let toastTimeout = null;

  const showToast = (message) => {
    if (!toastNotification) return;
    const toastText = toastNotification.querySelector('.toast-text');
    if (toastText) toastText.textContent = message;

    toastNotification.classList.add('is-visible');
    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('is-visible');
    }, 3000);
  };

  const copyToClipboard = async (text) => {
    let copied = false;

    // Intento 1: API moderna si estamos en contexto seguro
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (err) {
        copied = false;
      }
    }

    // Intento 2: Fallback clásico con textarea (funciona siempre en file:// y local)
    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.warn('Error en fallback de copiado:', e);
      }
    }

    if (copied) {
      showToast('¡Email copiado al portapapeles!');
    } else {
      // Si por alguna razón de permisos el navegador bloquea ambos:
      window.prompt('Copiá la dirección de email:', text);
    }

    return copied;
  };

  // Botones con clase .copy-email-btn en la página
  const pageCopyButtons = document.querySelectorAll('.copy-email-btn');
  pageCopyButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = btn.getAttribute('data-email') || EMAIL_CONTACT;
      await copyToClipboard(email);

      // Feedback visual en el botón
      const copyText = btn.querySelector('.copy-text');
      const prevText = copyText ? copyText.textContent : '';
      if (copyText) copyText.textContent = '¡Email copiado!';
      btn.classList.add('copied');

      setTimeout(() => {
        if (copyText) copyText.textContent = prevText || 'Copiar email';
        btn.classList.remove('copied');
      }, 2500);
    });
  });

  // ------------------------------------------------------------------------
  // 8. GENERADOR DINÁMICO DE ENLACES DE CONTACTO (GMAIL Y MAILTO)
  // ------------------------------------------------------------------------
  const generateContactURLs = (customData = {}) => {
    const name = customData.name ? customData.name.trim() : '';
    const service = customData.service ? customData.service.trim() : 'Presupuesto a medida';
    const details = customData.details ? customData.details.trim() : '';

    const subject = `Consulta de presupuesto: ${service} - Scroll Studio`;

    let bodyText = `Hola Thiago,\n\nTe escribo para pedirte presupuesto para mi proyecto web.\n\n`;
    if (name) {
      bodyText += `- Mi nombre o empresa: ${name}\n`;
    } else {
      bodyText += `- Mi nombre o empresa: \n`;
    }
    bodyText += `- Tipo de sitio: ${service}\n`;
    if (details) {
      bodyText += `- Detalles de lo que necesito:\n${details}\n\n`;
    } else {
      bodyText += `- Detalles o idea:\n\n`;
    }
    bodyText += `¡Muchas gracias!`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(bodyText);

    // Enlace de Gmail Web (se abre en cualquier navegador en pestaña nueva)
    const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL_CONTACT}&su=${encodedSubject}&body=${encodedBody}`;

    // Enlace de Mailto (para clientes de correo nativos de escritorio o móvil)
    const mailtoURL = `mailto:${EMAIL_CONTACT}?subject=${encodedSubject}&body=${encodedBody}`;

    return { gmailURL, mailtoURL, subject, bodyText };
  };

  const updateModalURLs = () => {
    if (!contactModal) return;

    const currentService = (compTypeSelect && compTypeSelect.value) 
      ? compTypeSelect.value 
      : (modalServiceName ? modalServiceName.textContent : 'Consulta general');

    const name = compNameInput ? compNameInput.value : '';
    const details = compDetailsTextarea ? compDetailsTextarea.value : '';

    const { gmailURL, mailtoURL } = generateContactURLs({
      name,
      service: currentService,
      details
    });

    if (modalBtnGmail) modalBtnGmail.href = gmailURL;
    if (modalBtnMailto) modalBtnMailto.href = mailtoURL;

    return { gmailURL, mailtoURL };
  };

  // ------------------------------------------------------------------------
  // 9. MODAL DE CONTACTO INTELIGENTE (CONTROL DE APERTURA Y CIERRE)
  // ------------------------------------------------------------------------
  let lastFocusedElement = null;

  const openContactModal = (serviceName = 'Consulta general') => {
    if (!contactModal) return;

    lastFocusedElement = document.activeElement;

    // Si el menú móvil estaba abierto, lo cerramos
    if (mainNav && mainNav.classList.contains('is-open') && mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('is-open');
    }

    // Actualizar nombre del servicio en el badge
    if (modalServiceName) {
      modalServiceName.textContent = serviceName;
    }

    // Sincronizar select si coincide
    if (compTypeSelect) {
      let matched = false;
      for (let i = 0; i < compTypeSelect.options.length; i++) {
        if (compTypeSelect.options[i].value.toLowerCase().includes(serviceName.toLowerCase()) ||
            serviceName.toLowerCase().includes(compTypeSelect.options[i].value.toLowerCase())) {
          compTypeSelect.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched && serviceName.toLowerCase().includes('todo vinos')) {
        compTypeSelect.value = 'Tienda Online / Ecommerce';
      }
    }

    updateModalURLs();

    // Abrir modal
    contactModal.classList.add('is-open');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Foco accesible al botón de cerrar
    setTimeout(() => {
      if (modalCloseBtn) modalCloseBtn.focus();
    }, 100);
  };

  const closeContactModal = () => {
    if (!contactModal) return;

    contactModal.classList.remove('is-open');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  };

  // Escuchar todos los botones que abren el modal
  const modalTriggers = document.querySelectorAll('.open-contact-modal');
  modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const service = trigger.getAttribute('data-service') || 'Consulta general';
      openContactModal(service);
    });
  });

  // Cerrar modal
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeContactModal);
  }

  // Cerrar al hacer clic en el backdrop oscuro
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        closeContactModal();
      }
    });
  }

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('is-open')) {
      closeContactModal();
    }
  });

  // Copiar email desde el modal
  if (modalBtnCopy) {
    modalBtnCopy.addEventListener('click', async (e) => {
      e.preventDefault();
      await copyToClipboard(EMAIL_CONTACT);

      if (modalCopyTitle) modalCopyTitle.textContent = '¡Email copiado!';
      if (modalCopyBadge) {
        modalCopyBadge.textContent = '¡Listo!';
        modalCopyBadge.classList.add('copied');
      }

      setTimeout(() => {
        if (modalCopyTitle) modalCopyTitle.textContent = 'Copiar email al portapapeles';
        if (modalCopyBadge) {
          modalCopyBadge.textContent = 'Copiar';
          modalCopyBadge.classList.remove('copied');
        }
      }, 2500);
    });
  }

  // Actualización reactiva al escribir en el formulario del modal
  if (compNameInput) compNameInput.addEventListener('input', updateModalURLs);
  if (compTypeSelect) compTypeSelect.addEventListener('change', () => {
    if (modalServiceName) modalServiceName.textContent = compTypeSelect.value;
    updateModalURLs();
  });
  if (compDetailsTextarea) compDetailsTextarea.addEventListener('input', updateModalURLs);

  // Enviar desde el formulario vía Gmail
  if (modalComposerForm) {
    modalComposerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { gmailURL } = updateModalURLs();
      window.open(gmailURL, '_blank', 'noopener,noreferrer');
      showToast('Abriendo Gmail en una nueva pestaña...');
    });
  }

  // Enviar desde el formulario vía App de correo
  if (composerSubmitMail) {
    composerSubmitMail.addEventListener('click', (e) => {
      e.preventDefault();
      const { mailtoURL } = updateModalURLs();
      window.location.href = mailtoURL;
      showToast('Abriendo tu aplicación de correo...');
    });
  }

});
