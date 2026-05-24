const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

const header = document.querySelector(".site-header");
window.addEventListener(
  "scroll",
  () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 40);
  },
  { passive: true }
);

const heroMedia = document.querySelector("[data-hero-media]");
if (heroMedia && !prefersReduced) {
  window.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 14;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    heroMedia.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.015)`;
  });
}

const parallaxImages = [...document.querySelectorAll(".parallax-img")];
const parallaxTexts = [...document.querySelectorAll("[data-parallax-text]")];
const finalParallaxImage = document.querySelector(".final-parallax-image");
const updateParallax = () => {
  if (prefersReduced) return;
  parallaxImages.forEach((image) => {
    const rect = image.parentElement.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const clamped = Math.max(0, Math.min(1, progress));
    const offset = (clamped - 0.5) * 42;
    image.style.transform = `translate3d(0, ${offset}px, 0) scale(1.1)`;
  });

  parallaxTexts.forEach((text) => {
    const root = text.closest(".hero, .final-cta") || text.parentElement;
    const rect = root.getBoundingClientRect();
    const depth = Number(text.dataset.depth || 0.08);
    const rawOffset = (rect.top + rect.height / 2 - window.innerHeight / 2) * depth;
    const offset = Math.max(-34, Math.min(34, rawOffset));
    text.style.transform = `translate3d(0, ${offset}px, 0)`;
  });

  if (finalParallaxImage) {
    const rect = finalParallaxImage.parentElement.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const clamped = Math.max(0, Math.min(1, progress));
    const offset = (clamped - 0.5) * 58;
    finalParallaxImage.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
  }
};
window.addEventListener("scroll", updateParallax, { passive: true });
window.addEventListener("resize", updateParallax);
updateParallax();

let lastKnownScrollY = window.scrollY;
const syncParallaxAfterProgrammaticScroll = () => {
  if (window.scrollY !== lastKnownScrollY) {
    lastKnownScrollY = window.scrollY;
    updateParallax();
  }
  requestAnimationFrame(syncParallaxAfterProgrammaticScroll);
};
if (!prefersReduced) requestAnimationFrame(syncParallaxAfterProgrammaticScroll);

const magneticItems = document.querySelectorAll("[data-magnetic]");
magneticItems.forEach((item) => {
  item.addEventListener("mousemove", (event) => {
    if (prefersReduced || window.matchMedia("(hover: none)").matches) return;
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
    item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  item.addEventListener("mouseleave", () => {
    item.style.transform = "";
  });
});

const filterButtons = document.querySelectorAll("[data-filter]");
const portfolioItems = document.querySelectorAll(".portfolio-item");
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    portfolioItems.forEach((item) => {
      const match = filter === "all" || item.dataset.categories.includes(filter);
      item.classList.toggle("is-hidden", !match);
    });
  });
});

const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const galleryItems = [...portfolioItems];
let activeGalleryIndex = 0;

const openLightbox = (index) => {
  activeGalleryIndex = index;
  const item = galleryItems[activeGalleryIndex];
  lightboxImage.src = item.dataset.src;
  lightboxImage.alt = item.querySelector("img").alt;
  lightboxCaption.textContent = item.dataset.title;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  lightboxClose.focus();
};

const closeLightbox = () => {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  lightboxImage.src = "";
};

const stepLightbox = (direction) => {
  const visibleItems = galleryItems.filter((item) => !item.classList.contains("is-hidden"));
  const currentVisibleIndex = visibleItems.indexOf(galleryItems[activeGalleryIndex]);
  const nextVisibleIndex = (currentVisibleIndex + direction + visibleItems.length) % visibleItems.length;
  activeGalleryIndex = galleryItems.indexOf(visibleItems[nextVisibleIndex]);
  openLightbox(activeGalleryIndex);
};

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => openLightbox(index));
});

document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => stepLightbox(1));
document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => stepLightbox(-1));
lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (event) => {
  if (!lightbox?.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowRight") stepLightbox(1);
  if (event.key === "ArrowLeft") stepLightbox(-1);
});

const slides = [...document.querySelectorAll(".review-slide")];
const dotsWrap = document.querySelector("[data-review-dots]");
let reviewIndex = 0;
let reviewTimer;

const showReview = (index) => {
  reviewIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === reviewIndex));
  dotsWrap?.querySelectorAll("button").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === reviewIndex));
};

const startReviews = () => {
  if (prefersReduced) return;
  clearInterval(reviewTimer);
  reviewTimer = setInterval(() => showReview(reviewIndex + 1), 5200);
};

slides.forEach((_, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `Показать отзыв ${index + 1}`);
  dot.addEventListener("click", () => {
    showReview(index);
    startReviews();
  });
  dotsWrap?.append(dot);
});

document.querySelector("[data-review-next]")?.addEventListener("click", () => {
  showReview(reviewIndex + 1);
  startReviews();
});

document.querySelector("[data-review-prev]")?.addEventListener("click", () => {
  showReview(reviewIndex - 1);
  startReviews();
});

showReview(0);
startReviews();

document.querySelectorAll(".price-card [data-format]").forEach((link) => {
  link.addEventListener("click", () => {
    const select = document.querySelector('select[name="format"]');
    if (select) select.value = link.dataset.format;
  });
});

document.querySelector("[data-contact-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  status.textContent = "Спасибо. Заявка подготовлена, Екатерина свяжется с вами для уточнения деталей.";
  form.reset();
});
