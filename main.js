// Мобильная навигация. Без JS остаётся доступным обычное меню.
const header = document.querySelector(".header");
const menuToggle = document.querySelector(".header__toggle");
const headerMenu = document.querySelector("#header-menu");

if (header && menuToggle && headerMenu) {
  const mobileMenu = window.matchMedia("(max-width: 768px)");

  function setMenuOpen(open, returnFocus = false) {
    const isOpen = mobileMenu.matches && open;
    header.classList.toggle("header--menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    headerMenu.inert = mobileMenu.matches && !isOpen;
    if (returnFocus) menuToggle.focus({ preventScroll: true });
  }

  function updateHeaderHeight() {
    header.style.setProperty("--header-height", `${header.offsetHeight}px`);
  }

  menuToggle.hidden = false;
  header.classList.add("header--menu-ready");
  setMenuOpen(false);
  updateHeaderHeight();

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  headerMenu.addEventListener("click", (event) => {
    if (mobileMenu.matches && event.target.closest("a[href]")) {
      setMenuOpen(false, true);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("header--menu-open")) {
      event.preventDefault();
      setMenuOpen(false, true);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!header.contains(event.target)) setMenuOpen(false);
  });

  header.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) {
      setMenuOpen(false);
    }
  });

  mobileMenu.addEventListener("change", () => {
    const focusInMenu = headerMenu.contains(document.activeElement);
    const focusOnToggle = document.activeElement === menuToggle;
    setMenuOpen(false, mobileMenu.matches && focusInMenu);
    if (!mobileMenu.matches && focusOnToggle) {
      headerMenu.querySelector("a")?.focus({ preventScroll: true });
    }
    updateHeaderHeight();
  });

  window.addEventListener("resize", updateHeaderHeight);
}

// Parallax

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const imageWrappers = document.querySelectorAll(".parallax");

imageWrappers.forEach((wrapper) => {
  const image = wrapper.querySelector("img");

  if (!image) return;

  let ticking = false;

  function updateParallax() {
    if (motionPreference.matches) {
      image.style.removeProperty("transform");
      ticking = false;
      return;
    }

    const rect = wrapper.getBoundingClientRect();

    // Не обновляем картинку, когда секция вне экрана
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      ticking = false;
      return;
    }

    const speed = 2;
    let offset;

    if (wrapper.classList.contains("hero__image-wrapper")) {
      const availableSpace = Math.max(
        0,
        image.offsetHeight - wrapper.clientHeight,
      );

      // В начале страницы кадр стоит у верхнего края и движется только при прокрутке.
      offset = -Math.min(availableSpace, Math.max(0, -rect.top) * speed * 0.15);
    } else {
      // Двигаемся только в пределах запаса высоты, без пустых краёв.
      const progress = Math.max(
        0,
        Math.min(
          1,
          (window.innerHeight - rect.top) / (window.innerHeight + rect.height),
        ),
      );
      const availableSpace = Math.max(
        0,
        image.offsetHeight - wrapper.clientHeight,
      );
      offset = -Math.min(availableSpace, progress * availableSpace * speed / 2);
    }

    image.style.transform = `translate3d(0, ${offset}px, 0)`;

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateParallax);
  }

  window.addEventListener("scroll", requestUpdate, {
    passive: true,
  });

  window.addEventListener("resize", requestUpdate);
  motionPreference.addEventListener("change", requestUpdate);

  if (image.complete) {
    requestUpdate();
  } else {
    image.addEventListener("load", requestUpdate, {
      once: true,
    });
  }
});

//Slider

const galleryViewport = document.querySelector(".gallery__viewport");

if (galleryViewport) {
  const slides = Array.from(
    galleryViewport.querySelectorAll(".gallery__slide"),
  );
  const previousButton = document.querySelector(".gallery__arrow--prev");
  const nextButton = document.querySelector(".gallery__arrow--next");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function updateGalleryButtons() {
    const maxScroll = galleryViewport.scrollWidth - galleryViewport.clientWidth;
    previousButton.disabled = galleryViewport.scrollLeft <= 1;
    nextButton.disabled = galleryViewport.scrollLeft >= maxScroll - 1;
  }

  function moveGallery(direction) {
    if (slides.length < 2) return;
    const step = slides[1].offsetLeft - slides[0].offsetLeft;
    const maxScroll = galleryViewport.scrollWidth - galleryViewport.clientWidth;
    const target = Math.max(
      0,
      Math.min(maxScroll, galleryViewport.scrollLeft + direction * step),
    );

    galleryViewport.scrollTo({
      left: target,
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }

  previousButton.addEventListener("click", () => moveGallery(-1));
  nextButton.addEventListener("click", () => moveGallery(1));

  galleryViewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    moveGallery(event.key === "ArrowRight" ? 1 : -1);
  });

  galleryViewport.addEventListener("scroll", updateGalleryButtons, {
    passive: true,
  });
  window.addEventListener("resize", updateGalleryButtons);
  updateGalleryButtons();
}

// Каждый элемент появляется один раз при входе в экран.
// Без JS или при отключённой анимации весь контент остаётся видимым.
if ("IntersectionObserver" in window && !motionPreference.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) showElement(entry.target);
    });
  }, { rootMargin: "0px 0px 40px 0px", threshold: 0 });

  function showElement(element) {
    element.classList.remove("reveal--pending");
    element.classList.add("reveal--visible");
    observer.unobserve(element);
  }

  function watchElements(selector, stagger = 0, imageReveal = false) {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add("reveal");
      if (imageReveal) element.classList.add("reveal--image");
      element.style.setProperty("--reveal-delay", `${Math.min(index * stagger, 240)}ms`);

      // Секции выше экрана не прячем при восстановлении прокрутки.
      if (element.getBoundingClientRect().bottom <= 0) {
        showElement(element);
      } else {
        element.classList.add("reveal--pending");
        observer.observe(element);
      }
    });
  }

  watchElements(".gallery__title, .instagram__title");
  watchElements(".gallery__slider");
  watchElements(".about__img-box", 0, true);
  watchElements(".about__desc h2, .about__desc p", 110);
  watchElements(".services__eyebrow, .services__title, .services__lead", 90);
  watchElements(".services__item", 60);
  watchElements(".instagram__item", 45, true);
  watchElements(".footer__contacts, .footer__socials, .footer__copyright", 90);

  // При переходе с клавиатуры элемент показывается сразу.
  document.addEventListener("focusin", (event) => {
    const element = event.target.closest(".reveal--pending");
    if (element) {
      element.classList.add("reveal--instant");
      showElement(element);
    }
  });

  motionPreference.addEventListener("change", () => {
    if (!motionPreference.matches) return;
    document.querySelectorAll(".reveal--pending").forEach(showElement);
    observer.disconnect();
  });
}
