(() => {
  "use strict";

  const partials = [
    ["[data-partial=\"navbar\"]", "partials/navbar.html"],
    ["[data-partial=\"hero\"]", "partials/hero.html"],
    ["[data-partial=\"advantages\"]", "partials/advantages.html"],
    ["[data-partial=\"providers\"]", "partials/providers.html?v=20260618-catalog-mobile-tune"],
    ["[data-partial=\"faq\"]", "partials/faq.html"],
    ["[data-partial=\"footer\"]", "partials/footer.html"]
  ];
  const assetBase = window.API_LX_ASSET_BASE || "";
  const resolveLocalUrl = (url) => assetBase ? `${assetBase}${url}` : url;
  const rewritePartialAssets = (html) => {
    if (!assetBase) return html;
    return html.replace(/(src|href)="(assets\/|privacy\.html|demo-games\.html)/g, `$1="${assetBase}$2`);
  };

  async function loadPartials() {
    await Promise.all(partials.map(async ([selector, url]) => {
      const target = document.querySelector(selector);
      if (!target) return;
      const response = await fetch(resolveLocalUrl(url), { cache: "no-store" });
      if (!response.ok) throw new Error(`Unable to load partial: ${url}`);
      target.outerHTML = rewritePartialAssets(await response.text());
    }));
  }

  function initApp() {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersSlowUpdate = window.matchMedia("(update: slow)").matches;
  const translate = (key) => {
    const translations = window.API_LX_TRANSLATIONS || {};
    const lang = document.documentElement.lang || localStorage.getItem("api-lx-language") || "en";
    return translations[lang]?.[key] || translations.en?.[key] || key;
  };

  const formatMoney = (value) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Math.round(value));

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const topbar = $("[data-topbar]");
  const navLinks = $("[data-nav-links]");
  const menuToggle = $("[data-menu-toggle]");
              const navItems = $$(".nav-links a").map((link) => ({
    link,
    section: document.querySelector(link.getAttribute("href"))
  }));

  const setTopbarState = () => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const getScrollOffset = () => Math.ceil(topbar?.getBoundingClientRect().height || 0) + 14;

  const getSectionScrollAnchor = (target) => {
    if (!target) return null;
    if (target.id === "updates") {
      return target.querySelector(":scope .updates-section-title")
        || target.querySelector(".updates-release.is-active .updates-intro h2")
        || target.querySelector(".updates-intro h2")
        || target;
    }
    return target.querySelector(":scope h2") || target;
  };

  const scrollToSectionHeading = (target, { behavior = "smooth" } = {}) => {
    const anchor = getSectionScrollAnchor(target);
    if (!anchor) return;
    window.scrollTo({
      top: Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - getScrollOffset()),
      behavior
    });
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  $$('a[href^="#"]:not([data-section-nav-link]), [data-scroll-target]').forEach((el) => {
    el.addEventListener("click", (event) => {
      const targetSelector = el.getAttribute("href") || el.dataset.scrollTarget;
      const target = targetSelector && $(targetSelector);
      if (!target) return;
      event.preventDefault();
      navLinks.classList.remove("open");
      scrollToSectionHeading(target, { behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });

  const updateActiveNav = () => {
    const heroRect = $("#hero").getBoundingClientRect();
    const heroHeadlineRect = $("#hero h1").getBoundingClientRect();
    let current = null;
    const heroIsPrimaryView = (heroRect.top <= 160 && heroRect.bottom > 160) || (heroHeadlineRect.top < window.innerHeight * 0.72 && heroHeadlineRect.bottom > 96);
    if (!heroIsPrimaryView) {
      navItems.forEach((item) => {
        if (!item.section) return;
        const rect = item.section.getBoundingClientRect();
        if (rect.top <= 160 && rect.bottom > 160) current = item;
      });
    }
    navItems.forEach((item) => item.link.classList.toggle("active", item === current));
  };

  const sectionQuickNav = $("[data-section-nav]");
  const sectionQuickNavItems = sectionQuickNav
    ? $$("[data-section-nav-link]", sectionQuickNav).map((link) => ({
      link,
      section: document.querySelector(link.getAttribute("href"))
    })).filter((item) => item.section)
    : [];

  const syncSectionQuickNav = () => {
    if (!sectionQuickNav) return;
    const trigger = $("#benefits");
    if (!trigger) return;

    const shouldShow = trigger.getBoundingClientRect().top <= window.innerHeight * 0.58;
    sectionQuickNav.classList.toggle("is-visible", shouldShow);
    if (!shouldShow) sectionQuickNav.classList.remove("is-collapsed");
    sectionQuickNav.setAttribute("aria-hidden", shouldShow ? "false" : "true");

    const probeY = window.scrollY + getScrollOffset() + window.innerHeight * 0.24;
    let activeLink = null;
    sectionQuickNavItems.forEach((item) => {
      if (item.section.offsetTop <= probeY) activeLink = item.link;
    });

    sectionQuickNavItems.forEach((item) => {
      const isActive = item.link === activeLink;
      item.link.classList.toggle("is-active", isActive);
      if (isActive) {
        item.link.setAttribute("aria-current", "true");
      } else {
        item.link.removeAttribute("aria-current");
      }
    });
  };

  sectionQuickNavItems.forEach(({ link, section }) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navLinks.classList.remove("open");

      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      scrollToSectionHeading(section, { behavior: "auto" });
      if (event.detail > 0) link.blur();
      requestAnimationFrame(() => {
        root.style.scrollBehavior = previousBehavior;
        syncSectionQuickNav();
        updateActiveNav();
      });
    });
  });

  if (sectionQuickNav) {
    let quickNavTouched = false;
    const blurSectionQuickNavFocus = () => {
      if (sectionQuickNav.contains(document.activeElement)) {
        document.activeElement.blur?.();
      }
    };
    const isPointInQuickNavRightHold = (event) => {
      if (!event) return false;
      const rect = sectionQuickNav.getBoundingClientRect();
      const rightEdge = window.innerWidth || document.documentElement.clientWidth || rect.right;
      return event.clientX >= rect.right - 2 && event.clientX <= rightEdge + 2;
    };
    const stopQuickNavRightHold = () => {
      window.removeEventListener("pointermove", trackQuickNavRightHold);
    };
    const trackQuickNavRightHold = (event) => {
      if (!quickNavTouched || !sectionQuickNav.classList.contains("is-visible")) {
        stopQuickNavRightHold();
        return;
      }
      if (sectionQuickNav.matches(":hover") || isPointInQuickNavRightHold(event)) {
        sectionQuickNav.classList.remove("is-collapsed");
        return;
      }
      sectionQuickNav.classList.add("is-collapsed");
      blurSectionQuickNavFocus();
      stopQuickNavRightHold();
    };
    const expandSectionQuickNav = () => {
      if (!sectionQuickNav.classList.contains("is-visible")) return;
      quickNavTouched = true;
      sectionQuickNav.classList.remove("is-collapsed");
      stopQuickNavRightHold();
    };
    const collapseSectionQuickNav = (event) => {
      if (!quickNavTouched || !sectionQuickNav.classList.contains("is-visible")) return;
      if (isPointInQuickNavRightHold(event)) {
        sectionQuickNav.classList.remove("is-collapsed");
        window.addEventListener("pointermove", trackQuickNavRightHold, { passive: true });
        return;
      }
      sectionQuickNav.classList.add("is-collapsed");
      blurSectionQuickNavFocus();
      stopQuickNavRightHold();
    };

    sectionQuickNav.addEventListener("pointerenter", expandSectionQuickNav);
    sectionQuickNav.addEventListener("pointerleave", collapseSectionQuickNav);
    sectionQuickNav.addEventListener("focusin", expandSectionQuickNav);
    sectionQuickNav.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!sectionQuickNav.contains(document.activeElement)) collapseSectionQuickNav();
      });
    });
  }

  let navScrollFrame = 0;
  window.addEventListener("scroll", () => {
    if (navScrollFrame) return;
    navScrollFrame = requestAnimationFrame(() => {
      navScrollFrame = 0;
      setTopbarState();
      updateActiveNav();
      syncSectionQuickNav();
    });
  }, { passive: true });
  setTopbarState();
  updateActiveNav();
  syncSectionQuickNav();
  requestAnimationFrame(updateActiveNav);
  requestAnimationFrame(syncSectionQuickNav);
  window.addEventListener("hashchange", () => requestAnimationFrame(() => {
    updateActiveNav();
    syncSectionQuickNav();
  }));
  window.addEventListener("resize", () => requestAnimationFrame(syncSectionQuickNav), { passive: true });

  const applyScrollReveal = () => {
    const revealSelectors = [
      ".reveal",
      ".marquee-strip",
      "#benefits .benefits-showcase__head",
      "#benefits .benefit-card",
      "#catalog .section-head",
      "#catalog .catalog-card",
      "#map .map-copy",
      "#map .globe-stage",
      "#map .region-list",
      "#calculator .section-head",
      "#calculator .calculator-shell",
      "#calculator .control-card",
      "#calculator .calc-comparison",
      "#calculator .calc-chart-card",
      "#calculator .extra-revenue",
      "#faq .section-head",
      "#faq .faq-wrap",
      "#faq .faq-item",
      "#updates .updates-showcase",
      "#updates .timeline-entry",
      "#referral .referral-section-title",
      "#referral .referral-showcase",
      ".footer .footer-grid > *"
    ];

    $$(revealSelectors.join(",")).forEach((el, index) => {
      el.classList.add("reveal", "reveal-pop");
      el.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
    });
  };

  applyScrollReveal();

  const benefitsCarousel = $("[data-benefits-carousel]");
  if (benefitsCarousel) {
    const slides = $$("[data-benefit-slide]", benefitsCarousel);
    const prevButton = $("[data-benefits-prev]");
    const nextButton = $("[data-benefits-next]");
    let activeSlide = 0;
    let autoTimer = 0;

    const getSlideOffset = (index) => {
      let offset = index - activeSlide;
      const midpoint = slides.length / 2;
      if (offset > midpoint) offset -= slides.length;
      if (offset < -midpoint) offset += slides.length;
      return offset;
    };

    const getSlideSpacing = () => {
      const width = benefitsCarousel.getBoundingClientRect().width || window.innerWidth || 1200;
      if (width < 720) return width * 0.62;
      return clamp(width * 0.24, 230, 340);
    };

    const syncBenefitsCarousel = () => {
      const spacing = getSlideSpacing();
      slides.forEach((slide, index) => {
        const offset = getSlideOffset(index);
        const absOffset = Math.abs(offset);
        const isActive = absOffset === 0;
        const isNear = absOffset === 1;
        const isFar = absOffset === 2;
        const isVisible = absOffset <= 2;
        const direction = offset < 0 ? 1 : -1;
        const scale = isActive ? 1 : isNear ? 0.82 : 0.66;
        const opacity = isActive ? 1 : isNear ? 0.58 : isFar ? 0.25 : 0;
        const translateZ = isActive ? 74 : isNear ? -66 : -178;
        const rotateY = isActive ? 0 : direction * (isNear ? 10 : 16);

        slide.style.setProperty("--carousel-x", `${offset * spacing}px`);
        slide.style.setProperty("--carousel-z", `${translateZ}px`);
        slide.style.setProperty("--carousel-scale", scale.toString());
        slide.style.setProperty("--carousel-rotate", `${rotateY}deg`);
        slide.style.setProperty("--carousel-opacity", opacity.toString());
        slide.style.setProperty("--carousel-z-index", String(30 - absOffset));
        slide.classList.toggle("is-active", isActive);
        slide.classList.toggle("is-near", isNear);
        slide.classList.toggle("is-far", isFar);
        slide.classList.toggle("is-hidden", !isVisible);
        slide.setAttribute("aria-hidden", isVisible ? "false" : "true");
        slide.tabIndex = isVisible ? 0 : -1;
      });
    };

    const setBenefitsSlide = (index) => {
      activeSlide = (index + slides.length) % slides.length;
      syncBenefitsCarousel();
    };

    const moveBenefitsSlide = (direction) => {
      setBenefitsSlide(activeSlide + direction);
    };

    const stopBenefitsAutoplay = () => {
      if (!autoTimer) return;
      window.clearInterval(autoTimer);
      autoTimer = 0;
    };

    const startBenefitsAutoplay = () => {
      if (prefersReducedMotion || autoTimer || slides.length < 2) return;
      autoTimer = window.setInterval(() => moveBenefitsSlide(1), 3800);
    };

    slides.forEach((slide, index) => {
      slide.addEventListener("click", () => setBenefitsSlide(index));
      slide.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setBenefitsSlide(index);
          return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          moveBenefitsSlide(event.key === "ArrowLeft" ? -1 : 1);
        }
      });
    });

    prevButton?.addEventListener("click", () => moveBenefitsSlide(-1));
    nextButton?.addEventListener("click", () => moveBenefitsSlide(1));
    benefitsCarousel.addEventListener("pointerenter", stopBenefitsAutoplay);
    benefitsCarousel.addEventListener("pointerleave", startBenefitsAutoplay);
    benefitsCarousel.addEventListener("focusin", stopBenefitsAutoplay);
    benefitsCarousel.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!benefitsCarousel.contains(document.activeElement)) startBenefitsAutoplay();
      });
    });

    let carouselResizeFrame = 0;
    window.addEventListener("resize", () => {
      if (carouselResizeFrame) return;
      carouselResizeFrame = requestAnimationFrame(() => {
        carouselResizeFrame = 0;
        syncBenefitsCarousel();
      });
    }, { passive: true });

    syncBenefitsCarousel();
    startBenefitsAutoplay();
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.02, rootMargin: "0px 0px 18% 0px" });

  $$(".reveal").forEach((el, index) => {
    if (!el.style.getPropertyValue("--reveal-delay")) {
      el.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
    }
    revealObserver.observe(el);
  });

  const benefitsTabsRoot = $("[data-benefits-tabs]");
  if (benefitsTabsRoot) {
    const benefitItems = [
      { titleKey: "benefit_1_title", textKey: "benefit_1_text", icon: "assets/why-tab-sliders.png?v=20260527-creative" },
      { titleKey: "benefit_2_title", textKey: "benefit_2_text", icon: "assets/why-tab-briefcase.png?v=20260527-creative" },
      { titleKey: "benefit_3_title", textKey: "benefit_3_text", icon: "assets/why-tab-globe.png?v=20260527-creative" },
      { titleKey: "benefit_4_title", textKey: "benefit_4_text", icon: "assets/why-tab-calendar.png?v=20260527-creative" },
      { titleKey: "benefit_5_title", textKey: "benefit_5_text", icon: "assets/why-tab-support.png?v=20260527-creative" },
      { titleKey: "benefit_6_title", textKey: "benefit_6_text", icon: "assets/why-tab-key.png?v=20260527-creative" }
    ];
    const titleTarget = $("[data-benefit-title]", benefitsTabsRoot);
    const textTarget = $("[data-benefit-text]", benefitsTabsRoot);
    const counterTarget = $("[data-benefit-counter]", benefitsTabsRoot);
    const tabsTarget = $("[data-benefit-tabs]", benefitsTabsRoot);
    let activeBenefitIndex = 0;

    const renderBenefitsTabs = () => {
      tabsTarget.innerHTML = benefitItems.map((item, index) => `
        <button class="why-tabs__tab" type="button" role="tab" id="benefit-tab-${index + 1}" aria-controls="benefit-panel" aria-selected="false" tabindex="-1" data-benefit-tab="${index}">
          <img class="why-tabs__tab-icon" src="${item.icon}" alt="" decoding="async" width="86" height="70" aria-hidden="true" />
          <span class="why-tabs__tab-label">${translate(item.titleKey)}</span>
        </button>
      `).join("");
    };

    const setActiveBenefit = (index) => {
      activeBenefitIndex = (index + benefitItems.length) % benefitItems.length;
      const activeItem = benefitItems[activeBenefitIndex];
      benefitsTabsRoot.dataset.activeBenefit = String(activeBenefitIndex + 1);
      titleTarget.textContent = translate(activeItem.titleKey);
      textTarget.textContent = translate(activeItem.textKey);
      counterTarget.textContent = `${String(activeBenefitIndex + 1).padStart(2, "0")} / ${String(benefitItems.length).padStart(2, "0")}`;

      $$("[data-benefit-tab]", tabsTarget).forEach((tab, tabIndex) => {
        const isActive = tabIndex === activeBenefitIndex;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.setAttribute("aria-expanded", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;
      });
    };

    renderBenefitsTabs();
    setActiveBenefit(0);

    tabsTarget.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-benefit-tab]");
      if (!tab) return;
      setActiveBenefit(Number(tab.dataset.benefitTab || 0));
    });

    tabsTarget.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? benefitItems.length - 1 : activeBenefitIndex + direction;
      setActiveBenefit(nextIndex);
      $$("[data-benefit-tab]", tabsTarget)[activeBenefitIndex]?.focus();
    });

    window.addEventListener("api-lx-language-change", () => {
      renderBenefitsTabs();
      setActiveBenefit(activeBenefitIndex);
    });
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      let start = null;
      const duration = 900;
      const tick = (time) => {
        start ??= time;
        const progress = clamp((time - start) / duration, 0, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toString();
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach((el) => countObserver.observe(el));

  $$("#updates .updates-timeline").forEach((timeline) => {
    const updateEntries = $$(".timeline-entry", timeline);
    if (!updateEntries.length) return;

    const setActiveUpdate = (activeEntry) => {
      updateEntries.forEach((entry) => {
        const isActive = entry === activeEntry;
        entry.classList.toggle("is-open", isActive);
        entry.setAttribute("aria-expanded", isActive ? "true" : "false");
      });
    };

    updateEntries.forEach((entry, index) => {
      entry.tabIndex = 0;
      entry.setAttribute("role", "button");
      entry.setAttribute("aria-expanded", index === 0 ? "true" : "false");
      entry.classList.toggle("is-open", index === 0);

      entry.addEventListener("click", (event) => {
        if (event.target.closest("[data-lead-open], a, button")) return;
        setActiveUpdate(entry);
      });
      entry.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setActiveUpdate(entry);
      });
    });
  });

  $$("[data-updates-carousel]").forEach((carousel) => {
    const slides = $$("[data-update-slide]", carousel);
    const olderButton = $("[data-updates-older]", carousel);
    const newerButton = $("[data-updates-newer]", carousel);
    if (slides.length < 2 || !olderButton || !newerButton) return;

    let activeIndex = clamp(Number(carousel.dataset.activeUpdate || slides.length - 1), 0, slides.length - 1);

    const renderUpdatesCarousel = () => {
      carousel.dataset.activeUpdate = String(activeIndex);
      carousel.style.setProperty("--updates-index", String(activeIndex));
      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        slide.toggleAttribute("inert", !isActive);
      });
      olderButton.hidden = activeIndex <= 0;
      newerButton.hidden = activeIndex >= slides.length - 1;
    };

    olderButton.addEventListener("click", () => {
      activeIndex = Math.max(0, activeIndex - 1);
      renderUpdatesCarousel();
    });

    newerButton.addEventListener("click", () => {
      activeIndex = Math.min(slides.length - 1, activeIndex + 1);
      renderUpdatesCarousel();
    });

    renderUpdatesCarousel();
  });

  if (window.API_LX_ENABLE_TILT === true) $$(".glass[data-tilt], [data-tilt]").forEach((card) => {
    if (card.classList.contains("catalog-card")) return;
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
      if (card.closest("[data-rtp-core]") && !prefersReducedMotion) {
        card.style.setProperty("--px", `${(x - 50) * 0.08}px`);
        card.style.setProperty("--py", `${(y - 50) * 0.06}px`);
      }
      if (card.classList.contains("api-console") || card.classList.contains("catalog-card")) {
        const rotateY = (x - 50) * 0.08;
        const rotateX = (50 - y) * 0.08;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      }
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
      card.style.removeProperty("--px");
      card.style.removeProperty("--py");
      if (card.classList.contains("api-console") || card.classList.contains("catalog-card")) {
        card.style.transform = "";
      }
    });
  });

  const hero = $("#hero");
  const coreSection = $("[data-rtp-core]");
  const coreCards = $$(".control-core-grid .benefit-card", coreSection || document);
  if (hero && coreSection) {
    hero.style.setProperty("--hero-dim", "0");
    hero.style.setProperty("--hero-scale", "1");
    coreSection.style.setProperty("--core-progress", "1");
    coreSection.style.setProperty("--core-bg-scale", "0.98");
    coreSection.style.setProperty("--core-head-y", "0px");
    coreSection.style.setProperty("--core-head-opacity", "1");
    coreSection.style.setProperty("--core-orb-scale", "1");
    coreSection.style.setProperty("--core-orb-rotate", "18deg");
    coreSection.style.setProperty("--core-orb-opacity", "1");
    coreSection.style.setProperty("--core-ring-a", "90deg");
    coreSection.style.setProperty("--core-ring-b", "-120deg");
    coreSection.style.setProperty("--core-ring-c", "80deg");
    coreCards.forEach((card) => {
      card.style.setProperty("--card-progress", "1");
      card.style.setProperty("--card-blur", "0px");
      card.style.setProperty("--card-y", "0px");
      card.style.setProperty("--card-z", "0px");
      card.style.setProperty("--card-rx", "0deg");
      card.style.setProperty("--card-ry", "0deg");
      card.style.setProperty("--card-scale", "1");
    });
  }

  const canvas = window.API_LX_ENABLE_PARTICLES === true ? $("[data-particles]") : null;
  const ctx = canvas?.getContext("2d");
  let particles = [];

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = window.innerWidth < 760 ? 24 : 42;
    particles = Array.from({ length: (prefersReducedMotion || prefersSlowUpdate) ? 16 : count }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vy: 0.18 + Math.random() * 0.42,
      drift: (Math.random() - 0.5) * 0.16,
      r: 0.75 + Math.random() * 1.15,
      alpha: 0.28 + Math.random() * 0.58,
      twinkle: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.78 ? "gold" : "cyan"
    }));
  };

  const drawParticles = () => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    particles.forEach((p) => {
      p.y -= p.vy;
      p.x += Math.sin(p.twinkle) * p.drift;
      p.twinkle += 0.025;
      if (p.y < -12) {
        p.y = rect.height + Math.random() * 70;
        p.x = Math.random() * rect.width;
      }
      if (p.x < -12) p.x = rect.width + 12;
      if (p.x > rect.width + 12) p.x = -12;
      const pulse = 0.55 + Math.sin(p.twinkle) * 0.28;
      const alpha = Math.max(0.18, p.alpha * pulse);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.hue === "gold" ? `rgba(255,201,107,${alpha})` : `rgba(47,243,255,${alpha})`;
      ctx.fill();
    });
    if (!prefersReducedMotion && !prefersSlowUpdate) requestAnimationFrame(drawParticles);
  };

  if (canvas && ctx) {
    resizeCanvas();
    drawParticles();
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }

  const modal = $("[data-modal]");
  const modalTitle = $("#modalTitle");
  const demoGrid = $("[data-demo-grid]");
  const demoGames = ["Gates of Olympus", "Sweet Bonanza", "Sugar Rush", "Book of Dead style", "20 Golden Coins", "Fortune Tiger"];

  const openModal = (provider) => {
    modalTitle.textContent = translate("demo_modal_title").replace("{provider}", provider);
    demoGrid.innerHTML = demoGames.map((game) => `
      <article class="demo-card">
        <h3>${game}</h3>
        <span>${provider}</span>
        <!-- Replace href="#" with the real demo game URL for this title. -->
        <a class="btn primary" href="#"><span>${translate("launch_demo")}</span></a>
      </article>
    `).join("");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  $$("[data-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      openLeadModal();
    });
  });
  const catalogGrid = $("#catalog .catalog-grid");
  const catalogCards = $$("#catalog .catalog-card");
  const setActiveCatalogCard = (activeCard) => {
    if (!catalogGrid || !catalogCards.length) return;
    const activeIndex = catalogCards.indexOf(activeCard) + 1;
    catalogGrid.classList.add("has-active");
    catalogGrid.classList.remove("active-1", "active-2", "active-3", "active-4");
    catalogGrid.classList.add(`active-${activeIndex}`);
    catalogCards.forEach((card) => card.classList.toggle("is-active", card === activeCard));
  };
  const clearActiveCatalogCard = () => {
    if (!catalogGrid || !catalogCards.length) return;
    catalogGrid.classList.remove("has-active");
    catalogGrid.classList.remove("active-1", "active-2", "active-3", "active-4");
    catalogCards.forEach((card) => card.classList.remove("is-active"));
  };
  if (catalogCards.length) {
    catalogCards.forEach((card) => {
      card.addEventListener("mouseenter", () => setActiveCatalogCard(card));
      card.addEventListener("focusin", () => setActiveCatalogCard(card));
    });
    catalogGrid?.addEventListener("mouseleave", clearActiveCatalogCard);
    catalogGrid?.addEventListener("focusout", (event) => {
      if (!catalogGrid.contains(event.relatedTarget)) clearActiveCatalogCard();
    });
  }
  $("[data-modal-close]").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  const languageSystem = window.API_LX_LANGUAGE.initLanguageSystem({ modal, closeModal });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
    if (event.key === "Escape") languageSystem.closeLanguageModal();
    if (event.key === "Escape") languageSystem.closeLanguageMenu();
  });

  const tooltip = $("[data-map-tooltip]");
  $$(".marker").forEach((marker) => {
    marker.addEventListener("pointerenter", () => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `<strong>${translate(`country_${marker.dataset.country.toLowerCase().replaceAll(" ", "_")}`)}</strong><br>${translate("map_tooltip_clients").replace("{count}", marker.dataset.clients)}`;
    });
    marker.addEventListener("pointermove", (event) => {
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
    });
    marker.addEventListener("pointerleave", () => {
      tooltip.style.display = "none";
    });
  });

  const turnoverRange = $("#turnoverRange");
  const turnoverInput = $("#turnoverInput");
  const rtpRange = $("#rtpRange");
  const rtpStory = $("[data-rtp-story]");
  const moneyTargets = {
    turnoverLabel: $("[data-turnover-label]"),
    rtpLabel: $("[data-rtp-label]"),
    otherGgr: $("[data-other-ggr]"),
    otherNet: $("[data-other-net]"),
    apiRtp: $("[data-api-rtp]"),
    apiRate: $("[data-api-rate]"),
    apiGgr: $("[data-api-ggr]"),
    apiNet: $("[data-api-net]"),
    extra: $("[data-extra]")
  };
  const chartCards = $$("[data-chart]");
  const turnoverBars = $$("[data-turnover-bars] span");
  const rtpBars = $$("[data-rtp-bars] span");
  const chartElements = chartCards.map((card) => ({
    card,
    otherValue: $("[data-other-value]", card),
    apiValue: $("[data-api-value]", card),
    otherBar: $("[data-other-bar]", card),
    apiBar: $("[data-api-bar]", card),
    delta: $("[data-delta]", card)
  }));
  const valueAnimations = new WeakMap();

  const animateValue = (el, nextValue, formatter = formatMoney, shouldAnimate = true) => {
    if (!el) return;
    const activeAnimation = valueAnimations.get(el);
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    const previous = Number(el.dataset.value || 0);
    el.dataset.value = String(nextValue);

    if (!shouldAnimate || prefersReducedMotion) {
      el.textContent = formatter(nextValue);
      valueAnimations.delete(el);
      return;
    }

    const start = performance.now();
    const duration = 260;
    const tick = (now) => {
      const progress = duration ? clamp((now - start) / duration, 0, 1) : 1;
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatter(previous + (nextValue - previous) * eased);
      if (progress < 1) {
        valueAnimations.set(el, requestAnimationFrame(tick));
      } else {
        valueAnimations.delete(el);
      }
    };
    valueAnimations.set(el, requestAnimationFrame(tick));
  };

  let calculatorFrame = 0;
  let calculatorNeedsAnimation = false;

  const updateCalculator = (options = {}) => {
    const shouldAnimate = options.animate === true;
    const turnover = clamp(Number(turnoverInput.value || turnoverRange.value), Number(turnoverRange.min), Number(turnoverRange.max));
    const rtp = clamp(Number(rtpRange.value), Number(rtpRange.min), Number(rtpRange.max));
    turnoverRange.value = turnover;
    turnoverInput.value = turnover;

    const otherGgr = turnover * 0.04;
    const otherFee = otherGgr * 0.1;
    const otherNet = otherGgr - otherFee;
    const apiGgr = turnover * ((100 - rtp) / 100);
    const commission = apiGgr < 500000 ? 0.06 : apiGgr <= 1000000 ? 0.05 : 0.04;
    const apiFee = apiGgr * commission;
    const apiNet = apiGgr - apiFee;
    const extra = apiNet - otherNet;
    const turnoverProgress = (turnover - Number(turnoverRange.min)) / (Number(turnoverRange.max) - Number(turnoverRange.min));
    const rtpProgress = (rtp - Number(rtpRange.min)) / (Number(rtpRange.max) - Number(rtpRange.min));
    const barData = {
      rtp: { other: 96, api: rtp, format: (value) => `${Math.round(value)}%`, delta: rtp - 96 },
      commission: { other: 10, api: commission * 100, format: (value) => `${Math.round(value)}%`, delta: commission * 100 - 10 },
      ggr: { other: otherGgr, api: apiGgr, format: formatMoney, delta: otherGgr ? ((apiGgr / otherGgr) - 1) * 100 : 0 },
      net: { other: otherNet, api: apiNet, format: formatMoney, delta: otherNet ? ((apiNet / otherNet) - 1) * 100 : 0 }
    };

    moneyTargets.turnoverLabel.textContent = formatMoney(turnover);
    moneyTargets.rtpLabel.textContent = `${rtp}%`;
    if (moneyTargets.apiRtp) moneyTargets.apiRtp.textContent = `${rtp}%`;
    if (moneyTargets.apiRate) moneyTargets.apiRate.textContent = `${Math.round(commission * 100)}%`;
    if (rtpStory) rtpStory.style.setProperty("--api-rtp-progress", `${clamp(rtpProgress, 0, 1) * 100}%`);

    animateValue(moneyTargets.otherGgr, otherGgr, formatMoney, shouldAnimate);
    animateValue(moneyTargets.otherNet, otherNet, formatMoney, shouldAnimate);
    animateValue(moneyTargets.apiGgr, apiGgr, formatMoney, shouldAnimate);
    animateValue(moneyTargets.apiNet, apiNet, formatMoney, shouldAnimate);
    animateValue(moneyTargets.extra, extra, formatMoney, shouldAnimate);

    turnoverRange.style.setProperty("--range-progress", `${clamp(turnoverProgress, 0, 1) * 100}%`);
    rtpRange.style.setProperty("--range-progress", `${clamp(rtpProgress, 0, 1) * 100}%`);
    turnoverBars.forEach((bar, index) => {
      const stepProgress = (index + 1) / turnoverBars.length;
      const activeBoost = stepProgress <= turnoverProgress ? 5 : 0;
      bar.style.height = `${6 + index * 1.5 + activeBoost}px`;
      bar.classList.toggle("active", stepProgress <= turnoverProgress);
    });
    rtpBars.forEach((bar, index) => {
      const stepProgress = (index + 1) / rtpBars.length;
      const activeBoost = stepProgress <= rtpProgress ? 3 : 0;
      bar.style.height = `${6 + index * 1.2 + activeBoost}px`;
      bar.classList.toggle("active", stepProgress <= rtpProgress);
    });
    chartElements.forEach(({ card, otherValue, apiValue, otherBar, apiBar, delta }) => {
      const data = barData[card.dataset.chart];
      if (!data) return;
      const chartType = card.dataset.chart;
      const visualHeight = (value) => {
        const pairMax = Math.max(data.other, data.api, 1);
        const domains = {
          rtp: 100,
          commission: 10,
          ggr: pairMax,
          net: pairMax
        };
        const domain = Math.max(domains[chartType] || Math.max(data.other, data.api, 1), 1);
        const normalized = clamp(value / domain, 0, 1);
        return 8 + (Math.sqrt(normalized) * 92);
      };
      const otherHeight = visualHeight(data.other);
      const apiHeight = visualHeight(data.api);
      if (otherValue && !otherValue.matches("[data-other-ggr], [data-other-net]")) otherValue.textContent = data.format(data.other);
      if (apiValue && !apiValue.matches("[data-api-ggr], [data-api-net], [data-api-rtp], [data-api-rate]")) apiValue.textContent = data.format(data.api);
      if (otherBar) {
        otherBar.style.setProperty("--bar-height", `${otherHeight}%`);
        otherBar.style.setProperty("--bar-scale", String(clamp(otherHeight / 100, 0.08, 1)));
      }
      if (apiBar) {
        apiBar.style.setProperty("--bar-height", `${apiHeight}%`);
        apiBar.style.setProperty("--bar-scale", String(clamp(apiHeight / 100, 0.08, 1)));
      }
      if (delta) {
        const sign = data.delta > 0 ? "+" : "";
        delta.textContent = `${sign}${Math.round(data.delta)}%`;
        delta.classList.toggle("negative", data.delta < 0);
      }
    });
  };

  const scheduleCalculator = (options = {}) => {
    calculatorNeedsAnimation = calculatorNeedsAnimation || options.animate === true;
    if (calculatorFrame) return;
    calculatorFrame = requestAnimationFrame(() => {
      calculatorFrame = 0;
      const shouldAnimate = calculatorNeedsAnimation;
      calculatorNeedsAnimation = false;
      updateCalculator({ animate: shouldAnimate });
    });
  };

  turnoverRange.addEventListener("input", () => {
    turnoverInput.value = turnoverRange.value;
    scheduleCalculator();
  });
  turnoverInput.addEventListener("input", () => scheduleCalculator());
  turnoverInput.addEventListener("blur", () => updateCalculator());
  rtpRange.addEventListener("input", () => scheduleCalculator());
  [turnoverRange, rtpRange].forEach((range) => {
    range.addEventListener("pointerdown", () => document.body.classList.add("calculator-dragging"), { passive: true });
    range.addEventListener("pointerup", () => document.body.classList.remove("calculator-dragging"), { passive: true });
    range.addEventListener("pointercancel", () => document.body.classList.remove("calculator-dragging"), { passive: true });
    range.addEventListener("change", () => document.body.classList.remove("calculator-dragging"));
  });
  updateCalculator({ animate: true });

  const faqItems = $$(".faq-item");
  const setFaqItemOpen = (item, isOpen) => {
    const button = $(".faq-question", item);
    const answer = $(".faq-answer", item);
    item.classList.toggle("open", isOpen);
    button?.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (answer) answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : "0px";
  };

  faqItems.forEach((item) => {
    setFaqItemOpen(item, item.classList.contains("open"));
    $(".faq-question", item)?.addEventListener("click", () => {
      const shouldOpen = !item.classList.contains("open");
      faqItems.forEach((faqItem) => setFaqItemOpen(faqItem, faqItem === item && shouldOpen));
    });
  });

  window.addEventListener("api-lx-language-change", () => {
    faqItems.forEach((item) => {
      if (item.classList.contains("open")) setFaqItemOpen(item, true);
    });
  });

  const leadModal = $("[data-lead-modal]");
  const leadDialog = leadModal ? $(".lead-dialog", leadModal) : null;
  const leadForm = $("[data-lead-form]");
  const leadContent = $("[data-lead-content]");
  const leadSuccess = $("[data-lead-success]");
  const leadQuestion = $("[data-lead-question]");
  const leadHint = $("[data-lead-hint]");
  const leadProgress = $(".lead-progress");
  const leadProgressText = $("[data-lead-progress-text]");
  const leadProgressBar = $("[data-lead-progress-bar]");
  const leadActions = $(".lead-actions");
  const leadBack = $("[data-lead-back]");
  const leadNext = $("[data-lead-next]");
  const leadSubmit = $("[data-lead-submit]");
  const leadSubmitError = $("[data-lead-submit-error]");
  const leadTelegramLink = $(".lead-telegram-link");
  let lastFocusedElement = null;
  let leadStepIndex = 0;
  let leadState = {};
  let leadMode = "integration";
  let leadAutoAdvanceTimer = null;
  const leadEndpointUrl = window.API_LX_CONFIG?.leadEndpointUrl || "/api/lead";
  const turnstileSiteKey = window.API_LX_CONFIG?.turnstileSiteKey || window.NEXT_PUBLIC_TURNSTILE_SITE_KEY || window.PUBLIC_TURNSTILE_SITE_KEY || "";
  const turnstileContainer = $("[data-turnstile-container]");
  let turnstileWidgetId = null;
  let pendingTurnstileChallenge = null;
  const failedLeadStorageKey = "api-lx-failed-lead-payload";
  const leadTypes = {
    integration: "Integration lead",
    referral: "Referral partner"
  };

  const getCurrentLanguage = () => document.documentElement.lang || localStorage.getItem("api-lx-language") || "en";
  const t = (key) => {
    const translations = window.API_LX_TRANSLATIONS || {};
    const dictionary = translations[getCurrentLanguage()] || {};
    return dictionary[key] || translations.en?.[key] || key;
  };

  const leadErrors = {
    required: "lead_error_required",
    telegram: "lead_error_telegram",
    whatsapp: "lead_error_whatsapp",
    countries: "lead_error_countries"
  };

  const phoneCountryNameOverrides = {
    AC: "Ascension Island",
    TA: "Tristan da Cunha",
    XK: "Kosovo"
  };
  const popularPhoneCountryIsos = ["US", "GB", "BR", "IN", "TR", "MX", "ID", "DE", "ES", "FR", "IT", "AE"];
  const getFlagEmoji = (iso) => /^[A-Z]{2}$/.test(iso)
    ? String.fromCodePoint(...iso.split("").map((char) => char.charCodeAt(0) + 127397))
    : "🌐";
  const buildPhoneCountries = () => {
    const sourceCountries = Array.isArray(window.API_LX_PHONE_DATA) ? window.API_LX_PHONE_DATA : [];
    const locale = getCurrentLanguage() || navigator.language || "en";
    let displayNames = null;
    try {
      displayNames = typeof Intl !== "undefined" && Intl.DisplayNames
        ? new Intl.DisplayNames([locale, "en"], { type: "region" })
        : null;
    } catch {
      displayNames = null;
    }

    return sourceCountries.map((countryData) => {
      const iso = String(countryData.iso || "").toUpperCase();
      const dialCode = String(countryData.code || "");
      const name = phoneCountryNameOverrides[iso] || displayNames?.of(iso) || countryData.name || iso;
      return {
        iso,
        flag: countryData.flag || getFlagEmoji(iso),
        name,
        code: dialCode,
        dialDigits: String(countryData.dialDigits || dialCode.replace(/\D/g, "")),
        possibleLengths: Array.isArray(countryData.possibleLengths) ? countryData.possibleLengths : [],
        nationalPrefix: String(countryData.nationalPrefix || ""),
        popularIndex: popularPhoneCountryIsos.indexOf(iso),
        searchText: `${name} ${iso} ${dialCode} ${dialCode.replace(/\D/g, "")}`.toLowerCase()
      };
    }).sort((a, b) => a.name.localeCompare(b.name, locale));
  };
  const phoneCountries = buildPhoneCountries();

  const geoRegionIsos = {
    europe: ["AX", "AL", "AD", "AT", "BE", "BA", "BG", "HR", "CZ", "DK", "EE", "FO", "FI", "FR", "DE", "GI", "GR", "GG", "HU", "IS", "IE", "IM", "IT", "JE", "XK", "LV", "LI", "LT", "LU", "MT", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "GB", "VA"],
    cis: ["AM", "AZ", "BY", "KZ", "KG", "MD", "RU", "TJ", "TM", "UA", "UZ"],
    north_america: ["US", "CA", "MX", "BM", "GL", "PM"],
    latin_america: ["AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "SV", "GT", "HN", "NI", "PA", "PY", "PE", "PR", "UY", "VE", "BZ", "GY", "SR", "GF", "HT", "JM", "TT", "BB", "BS", "AG", "LC", "VC", "GD", "DM", "KN", "AI", "AW", "BQ", "CW", "SX", "KY", "TC", "VG", "VI", "MS", "GP", "MQ", "BL", "MF"],
    africa: ["DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "YT", "MA", "MZ", "NA", "NE", "NG", "RE", "RW", "SH", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "EH", "ZM", "ZW"],
    middle_east: ["AE", "BH", "CY", "EG", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "TR", "YE"],
    asia: ["AF", "BD", "BT", "BN", "KH", "CN", "CX", "CC", "HK", "IN", "ID", "JP", "LA", "MO", "MY", "MV", "MN", "MM", "NP", "KP", "PK", "PH", "SG", "KR", "LK", "TW", "TH", "TL", "VN", "UZ", "KZ", "KG", "TJ", "TM", "AZ", "AM", "GE"]
  };
  const geoRegionKeys = ["europe", "cis", "north_america", "latin_america", "africa", "middle_east", "asia", "other", "not_sure"];
  const geoRegionIsoUnion = new Set(Object.values(geoRegionIsos).flat());
  const leadStepKeys = ["projectStage", "stageTiming", "projectType", "geo", "activeProjects", "ggr", "contacts"];
  const optionOnlySteps = new Set(["projectStage", "activeLaunch", "livePlan", "projectType", "geo", "activeProjects", "ggr"]);
  const requiredChoiceSteps = new Set(["projectStage", "activeLaunch", "livePlan", "projectType", "activeProjects", "ggr"]);
  const canonicalLeadValues = {
    projectStage: { active: "Active project", development: "Project in development" },
    activeLaunch: { under_3_months: "Less than 3 months", over_3_months: "More than 3 months" },
    livePlan: { under_1_month: "Less than 1 month", "1_2_months": "More than 1 month", over_2_months: "More than 2 months" },
    projectType: { platform: "Platform provider", operator: "Operator", aggregator: "Aggregator", other: "Other" },
    regions: {
      europe: "Europe",
      cis: "CIS",
      north_america: "North America",
      latin_america: "Latin America",
      africa: "Africa",
      middle_east: "Middle East",
      asia: "Asia",
      other: "Other",
      not_sure: "Not sure yet"
    },
    activeProjects: { "1": "1", "2-5": "2-5", "5-10": "5-10", "10+": "10+" },
    ggr: { none: "None yet", "<500k": "<500k", "500k-1m": "500k-1m", "1m+": "1m+", prefer_not: "Prefer not to say" },
    source: { facebook: "Facebook", instagram: "Instagram", telegram: "Telegram", twitter: "Twitter", google_seo: "Google(or SEO)", other: "Other" }
  };

  const getLeadStepKey = (index = leadStepIndex) => {
    if (leadMode === "referral") return "contacts";
    const key = leadStepKeys[index];
    if (key !== "stageTiming") return key;
    return leadState.projectStage === "development" ? "livePlan" : "activeLaunch";
  };

  const getLeadStep = () => $('[data-step-key="' + getLeadStepKey() + '"]', leadForm);

  const getFocusableLeadElements = () => $$(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    leadDialog
  ).filter((element) => !element.disabled && element.offsetParent !== null);

  const setLeadError = (name, message = "") => {
    const error = $('[data-error-for="' + name + '"]', leadForm);
    if (error) error.textContent = message ? t(message) : "";
  };

  const clearLeadErrors = () => {
    $$('[data-error-for]', leadForm).forEach((error) => {
      error.textContent = "";
    });
    if (leadSubmitError) leadSubmitError.hidden = true;
  };

  const getPhoneElements = () => ({
    combobox: $("[data-country-combobox]", leadForm),
    trigger: $("[data-country-trigger]", leadForm),
    label: $("[data-country-label]", leadForm),
    panel: $("[data-country-panel]", leadForm),
    search: $("[data-country-search]", leadForm),
    options: $("[data-country-options]", leadForm),
    code: $('[name="whatsappCountryCode"]', leadForm),
    iso: $('[name="whatsappCountryIso"]', leadForm),
    local: $('[name="whatsappLocalNumber"]', leadForm),
    full: $('[name="whatsappNumber"]', leadForm)
  });

  const normalizePhoneDigits = (value = "") => String(value).replace(/\D/g, "");
  const stripNationalPrefix = (digits = "") => digits.replace(/^0+/, "");
  const compactPhoneCountryQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 760px)")
    : null;
  const isCompactPhoneCountry = () => Boolean(compactPhoneCountryQuery?.matches);
  const phoneLabel = (country) => {
    if (!country) return isCompactPhoneCountry() ? "+" : t("phone_select_country");
    return isCompactPhoneCountry() ? country.code : `${country.flag} ${country.name} ${country.code}`;
  };

  const getSelectedPhoneCountry = () => {
    const { iso, code } = getPhoneElements();
    const selectedIso = String(iso?.value || "").toUpperCase();
    const selectedCode = String(code?.value || "");
    return phoneCountries.find((country) => country.iso === selectedIso)
      || phoneCountries.find((country) => country.code === selectedCode)
      || null;
  };

  const refreshPhoneCountryLabel = () => {
    const { label } = getPhoneElements();
    if (label) label.textContent = phoneLabel(getSelectedPhoneCountry());
  };

  compactPhoneCountryQuery?.addEventListener?.("change", refreshPhoneCountryLabel);

  const getCountryFromLocale = () => {
    const configCountry = String(window.API_LX_CONFIG?.countryCode || window.API_LX_CONFIG?.geoCountryCode || "").toUpperCase();
    if (phoneCountries.some((country) => country.iso === configCountry)) return configCountry;
    const languages = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
    for (const language of languages) {
      const region = String(language).split("-")[1]?.toUpperCase();
      if (phoneCountries.some((country) => country.iso === region)) return region;
    }
    return "";
  };

  const getCountryFromIp = async () => {
    try {
      const response = await fetch("/cdn-cgi/trace", { cache: "no-store" });
      if (!response.ok) return "";
      const text = await response.text();
      const match = text.match(/^loc=([A-Z]{2})$/m);
      return match?.[1] || "";
    } catch {
      return "";
    }
  };

  let phoneAutoCountryPromise = null;
  const detectPhoneCountryIso = () => {
    if (!phoneAutoCountryPromise) {
      phoneAutoCountryPromise = getCountryFromIp().then((ipCountry) => ipCountry || getCountryFromLocale() || "US");
    }
    return phoneAutoCountryPromise;
  };

  const setPhoneCountry = (country, { focusLocal = false } = {}) => {
    const { combobox, trigger, label, panel, search, code, iso, local } = getPhoneElements();
    if (!country) return;
    if (code) code.value = country.code;
    if (iso) iso.value = country.iso;
    if (label) label.textContent = phoneLabel(country);
    if (panel) panel.hidden = true;
    combobox?.classList.remove("open");
    trigger?.setAttribute("aria-expanded", "false");
    if (search) search.value = "";
    setLeadError("whatsappNumber", "");
    syncWhatsappNumber();
    if (focusLocal) local?.focus?.();
  };

  const renderCountryOptions = (query = "") => {
    const { options } = getPhoneElements();
    if (!options) return;
    const selected = getSelectedPhoneCountry();
    const normalizedQuery = query.trim().toLowerCase();
    const searchedCountries = phoneCountries.filter((country) => {
      const normalizedDial = normalizedQuery.replace(/^\+/, "");
      return !normalizedQuery
        || country.searchText.includes(normalizedQuery)
        || (normalizedDial && country.dialDigits.startsWith(normalizedDial));
    });
    const popularCountries = normalizedQuery
      ? []
      : phoneCountries
        .filter((country) => country.popularIndex >= 0)
        .sort((a, b) => a.popularIndex - b.popularIndex);
    const popularIsoSet = new Set(popularCountries.map((country) => country.iso));
    const fullCountries = searchedCountries.filter((country) => !popularIsoSet.has(country.iso));
    options.replaceChildren();
    const addDivider = (label) => {
      const divider = document.createElement("div");
      divider.className = "country-option-divider";
      divider.setAttribute("role", "separator");
      divider.textContent = label;
      options.append(divider);
    };
    const addOption = (country) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "country-option";
      button.dataset.countryIso = country.iso;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(selected?.iso === country.iso));
      if (selected?.iso === country.iso) button.classList.add("active");
      const name = document.createElement("strong");
      name.textContent = `${country.flag} ${country.name}`;
      const code = document.createElement("span");
      code.textContent = country.code;
      button.append(name, code);
      options.append(button);
    };
    if (popularCountries.length) {
      addDivider(t("phone_popular_countries"));
      popularCountries.forEach(addOption);
      addDivider(t("phone_all_countries"));
    }
    fullCountries.forEach(addOption);
    if (!searchedCountries.length) {
      const empty = document.createElement("div");
      empty.className = "country-option-empty";
      empty.textContent = t("phone_no_countries");
      options.append(empty);
    }
  };

  const openCountryPanel = () => {
    const { combobox, trigger, panel, search } = getPhoneElements();
    if (!panel) return;
    renderCountryOptions(search?.value || "");
    panel.hidden = false;
    combobox?.classList.add("open");
    trigger?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => search?.focus?.());
  };

  const closeCountryPanel = () => {
    const { combobox, trigger, panel } = getPhoneElements();
    if (panel) panel.hidden = true;
    combobox?.classList.remove("open");
    trigger?.setAttribute("aria-expanded", "false");
  };

  const resetPhoneInput = () => {
    const { label, search, options } = getPhoneElements();
    if (label) label.textContent = phoneLabel(null);
    if (search) search.value = "";
    options?.replaceChildren();
    closeCountryPanel();
    detectPhoneCountryIso().then((iso) => {
      const { code } = getPhoneElements();
      if (code?.value) return;
      const country = phoneCountries.find((item) => item.iso === iso) || phoneCountries[0];
      setPhoneCountry(country);
      if (leadSubmit && getLeadStepKey() === "contacts") {
        leadSubmit.disabled = !isLeadContactComplete();
      }
    });
  };

  const findCountryByInternationalNumber = (value = "") => {
    const normalized = String(value).replace(/[^\d+]/g, "");
    if (!normalized.startsWith("+")) return null;
    const sorted = [...phoneCountries].sort((a, b) => b.code.length - a.code.length);
    const selected = getSelectedPhoneCountry();
    const sharedSelected = selected && normalized.startsWith(selected.code) ? selected : null;
    return sharedSelected || sorted.find((country) => normalized.startsWith(country.code)) || null;
  };

  const parseInternationalPhoneInput = () => {
    const { local } = getPhoneElements();
    const rawValue = String(local?.value || "");
    if (!rawValue.trim().startsWith("+")) return false;
    const country = findCountryByInternationalNumber(rawValue);
    if (!country) return false;
    const codeDigits = normalizePhoneDigits(country.code);
    const nationalDigits = normalizePhoneDigits(rawValue).slice(codeDigits.length);
    setPhoneCountry(country);
    if (local) local.value = nationalDigits;
    syncWhatsappNumber();
    return true;
  };

  const getPhoneValidation = () => {
    const country = getSelectedPhoneCountry();
    const { local } = getPhoneElements();
    if (!country) return { valid: false, e164: "", country: null };
    const nationalDigits = normalizePhoneDigits(local?.value || "");
    const e164 = `${country.code}${nationalDigits}`;
    const validLength = country.possibleLengths.length
      ? country.possibleLengths.includes(nationalDigits.length)
      : nationalDigits.length >= 4 && nationalDigits.length <= 14;
    const validE164 = /^\+[1-9]\d{7,14}$/.test(e164);
    return {
      valid: validLength && validE164,
      e164: validLength && validE164 ? e164 : "",
      country,
      nationalDigits
    };
  };

  const syncWhatsappNumber = () => {
    if (!leadForm) return "";
    const { full } = getPhoneElements();
    const validation = getPhoneValidation();
    if (full) full.value = validation.e164;
    return validation.e164;
  };

  const syncLeadSelections = () => {
    $$('[data-choice]', leadForm).forEach((button) => {
      const name = button.dataset.choice;
      const currentValue = leadState[name];
      const isSelected = Array.isArray(currentValue)
        ? currentValue.includes(button.dataset.value)
        : currentValue === button.dataset.value;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  };

  const getGeoElements = () => ({
    picker: $("[data-geo-picker]", leadForm),
    trigger: $("[data-geo-trigger]", leadForm),
    triggerLabel: $("[data-geo-trigger-label]", leadForm),
    panel: $("[data-geo-panel]", leadForm),
    search: $("[data-geo-search]", leadForm),
    options: $("[data-geo-options]", leadForm),
    selected: $("[data-geo-selected]", leadForm),
    empty: $("[data-geo-empty]", leadForm),
    selectAll: $("[data-geo-select-all]", leadForm),
    input: $("[data-lead-countries]", leadForm)
  });

  const getSelectedRegions = () => Array.isArray(leadState.regions) ? leadState.regions : [];
  const getSelectedCountryIsos = () => Array.isArray(leadState.countryIsos) ? leadState.countryIsos : [];

  const getAvailableGeoCountries = () => {
    const selectedRegions = getSelectedRegions();
    if (!selectedRegions.length || selectedRegions.includes("not_sure")) return [];
    const isoSet = new Set();
    selectedRegions.forEach((region) => {
      if (region === "other") {
        phoneCountries.forEach((country) => {
          if (!geoRegionIsoUnion.has(country.iso)) isoSet.add(country.iso);
        });
        return;
      }
      (geoRegionIsos[region] || []).forEach((iso) => isoSet.add(iso));
    });
    return phoneCountries.filter((country) => isoSet.has(country.iso));
  };

  const closeGeoPanel = () => {
    const { picker, trigger, panel } = getGeoElements();
    if (panel) panel.hidden = true;
    picker?.classList.remove("open");
    trigger?.setAttribute("aria-expanded", "false");
  };

  const syncGeoCountriesInput = () => {
    const { input, triggerLabel } = getGeoElements();
    const selectedRegions = getSelectedRegions();
    let countries = "";

    if (selectedRegions.includes("not_sure")) {
      countries = t("lead_region_not_sure");
    } else {
      const selectedIsoSet = new Set(getSelectedCountryIsos());
      countries = phoneCountries
        .filter((country) => selectedIsoSet.has(country.iso))
        .map((country) => country.name)
        .join(", ");
    }

    leadState.countries = countries;
    if (input) input.value = countries;
    if (triggerLabel) {
      const count = getSelectedCountryIsos().length;
      triggerLabel.textContent = count
        ? t("lead_countries_selected_count").replace("{count}", count)
        : t("lead_countries_select_placeholder");
    }
    return countries;
  };

  const renderGeoSelectedTags = () => {
    const { selected } = getGeoElements();
    if (!selected) return;
    selected.replaceChildren();
    const selectedIsoSet = new Set(getSelectedCountryIsos());
    phoneCountries
      .filter((country) => selectedIsoSet.has(country.iso))
      .forEach((country) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "geo-chip";
        chip.dataset.geoRemove = country.iso;
        chip.textContent = country.name;
        chip.setAttribute("aria-label", `${country.name} remove`);
        selected.append(chip);
      });
  };

  const renderGeoCountryOptions = (query = "") => {
    const { options, empty, selectAll } = getGeoElements();
    if (!options) return;
    const availableCountries = getAvailableGeoCountries();
    const selectedIsoSet = new Set(getSelectedCountryIsos());
    const normalizedQuery = query.trim().toLowerCase();
    const visibleCountries = availableCountries.filter((country) => {
      return !normalizedQuery || country.searchText.includes(normalizedQuery);
    });

    options.replaceChildren();
    if (empty) {
      empty.hidden = Boolean(visibleCountries.length);
      empty.textContent = availableCountries.length ? t("phone_no_countries") : t("lead_countries_empty");
    }

    visibleCountries.forEach((country) => {
      const label = document.createElement("label");
      label.className = "geo-option";
      label.setAttribute("role", "option");
      label.setAttribute("aria-selected", String(selectedIsoSet.has(country.iso)));

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.geoCountryIso = country.iso;
      checkbox.checked = selectedIsoSet.has(country.iso);

      const name = document.createElement("span");
      name.textContent = `${country.flag} ${country.name}`;

      label.append(checkbox, name);
      options.append(label);
    });

    if (selectAll) {
      const visibleIsoSet = new Set(visibleCountries.map((country) => country.iso));
      const visibleSelectedCount = getSelectedCountryIsos().filter((iso) => visibleIsoSet.has(iso)).length;
      selectAll.checked = Boolean(visibleCountries.length) && visibleSelectedCount === visibleCountries.length;
      selectAll.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleCountries.length;
      selectAll.disabled = !visibleCountries.length;
    }
  };

  const updateGeoCountryPicker = () => {
    const { picker, search } = getGeoElements();
    if (!picker) return;
    const selectedRegions = getSelectedRegions();
    const availableIsoSet = new Set(getAvailableGeoCountries().map((country) => country.iso));
    leadState.countryIsos = getSelectedCountryIsos().filter((iso) => availableIsoSet.has(iso));
    if (selectedRegions.includes("not_sure")) {
      leadState.countryIsos = [];
      closeGeoPanel();
    }
    if (search) search.value = "";
    picker.classList.toggle("is-ready", Boolean(selectedRegions.length) && !selectedRegions.includes("not_sure"));
    picker.classList.toggle("is-not-sure", selectedRegions.includes("not_sure"));
    renderGeoSelectedTags();
    syncGeoCountriesInput();
    renderGeoCountryOptions();
  };

  const openGeoPanel = () => {
    const { picker, trigger, panel, search } = getGeoElements();
    if (!panel || picker?.classList.contains("is-not-sure")) return;
    renderGeoCountryOptions(search?.value || "");
    panel.hidden = false;
    picker?.classList.add("open");
    trigger?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => search?.focus?.());
  };

  const isLeadContactComplete = () => {
    if (!leadForm) return false;
    syncWhatsappNumber();
    const data = new FormData(leadForm);
    const requiredFields = leadMode === "referral"
      ? ["name", "telegramId", "whatsappNumber", "privacyConsent"]
      : ["name", "telegramId", "whatsappNumber", "source", "privacyConsent"];
    return requiredFields.every((field) => String(data.get(field) || "").trim());
  };

  const focusCurrentLeadStep = () => {
    const step = getLeadStep();
    const target = $("button, input, textarea", step) || leadBack || leadDialog;
    target?.focus?.({ preventScroll: true });
  };

  const renderLeadStep = () => {
    if (!leadForm) return;
    const activeKey = getLeadStepKey();
    const isReferralMode = leadMode === "referral";

    leadContent?.classList.toggle("is-referral-mode", isReferralMode);
    leadForm.classList.toggle("is-referral-mode", isReferralMode);
    if (leadProgress) leadProgress.hidden = isReferralMode;

    $$('[data-step-key]', leadForm).forEach((step) => {
      const isActive = step.dataset.stepKey === activeKey;
      step.hidden = !isActive;
      step.classList.toggle("is-active", isActive);
    });

    const activeStep = getLeadStep();
    if (leadQuestion && activeStep) {
      leadQuestion.textContent = isReferralMode ? t("referral_modal_title") : t(activeStep.dataset.question || "");
    }
    if (leadHint && activeStep) {
      leadHint.textContent = isReferralMode ? t("referral_modal_subtitle") : t(activeStep.dataset.hint || "");
    }

    const progress = ((leadStepIndex + 1) / leadStepKeys.length) * 100;
    if (leadProgressText) leadProgressText.textContent = t("lead_progress")
      .replace("{current}", leadStepIndex + 1)
      .replace("{total}", leadStepKeys.length);
    if (leadProgressBar) leadProgressBar.style.width = progress + "%";

    syncLeadSelections();
    if (activeKey === "geo") updateGeoCountryPicker();
    clearLeadErrors();

    const isContactsStep = activeKey === "contacts";
    leadActions?.classList.toggle("is-contacts-step", isContactsStep);
    leadActions?.classList.toggle("is-referral-mode", isReferralMode);
    if (leadTelegramLink) leadTelegramLink.hidden = isContactsStep && !isReferralMode;
    if (leadBack) leadBack.hidden = isReferralMode || leadStepIndex === 0;
    if (leadNext) leadNext.hidden = isReferralMode || isContactsStep;
    if (leadSubmit) {
      leadSubmit.hidden = !isContactsStep;
      leadSubmit.disabled = !isLeadContactComplete();
    }

    window.clearTimeout(leadAutoAdvanceTimer);
    requestAnimationFrame(focusCurrentLeadStep);
  };

  const resetLeadState = (mode = "integration") => {
    leadMode = mode;
    leadForm?.reset();
    resetPhoneInput();
    syncWhatsappNumber();
    leadState = {};
    leadStepIndex = leadMode === "referral" ? leadStepKeys.length - 1 : 0;
    clearLeadErrors();
    if (leadContent) leadContent.hidden = false;
    if (leadSuccess) leadSuccess.hidden = true;
    if (leadSubmit) {
      leadSubmit.disabled = false;
      leadSubmit.removeAttribute("aria-busy");
    }
    if (leadSubmitError) leadSubmitError.hidden = true;
    renderLeadStep();
  };

  const showLeadModal = () => {
    if (!leadModal) return;
    leadModal.classList.add("open");
    leadModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(focusCurrentLeadStep);
  };

  const openLeadModal = () => {
    if (!leadModal) return;
    lastFocusedElement = document.activeElement;
    resetLeadState("integration");
    showLeadModal();
  };

  const openReferralPopup = () => {
    if (!leadModal) return;
    lastFocusedElement = document.activeElement;
    resetLeadState("referral");
    showLeadModal();
  };

  const closeLeadModal = () => {
    if (!leadModal) return;
    leadModal.classList.remove("open");
    leadModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.clearTimeout(leadAutoAdvanceTimer);
    lastFocusedElement?.focus?.();
  };

  const validateLeadStep = () => {
    clearLeadErrors();
    const key = getLeadStepKey();
    let isValid = true;

    if (requiredChoiceSteps.has(key) && !leadState[key]) {
      setLeadError(key, leadErrors.required);
      isValid = false;
    }

    if (key === "geo") {
      const regions = getSelectedRegions();
      if (!regions.length) {
        setLeadError("regions", leadErrors.required);
        isValid = false;
      }
      const countries = syncGeoCountriesInput();
      if (!countries) {
        setLeadError("countries", leadErrors.countries);
        isValid = false;
      }
    }

    if (key === "contacts") {
      syncWhatsappNumber();
      const data = new FormData(leadForm);
      const telegramId = String(data.get("telegramId") || "").trim();
      const whatsappNumber = String(data.get("whatsappNumber") || "").trim();
      const requiredContactFields = leadMode === "referral"
        ? ["name", "telegramId", "whatsappNumber", "privacyConsent"]
        : ["name", "telegramId", "whatsappNumber", "source", "privacyConsent"];

      requiredContactFields.forEach((field) => {
        if (!String(data.get(field) || "").trim()) {
          const errorMessage = field === "telegramId"
            ? leadErrors.telegram
            : field === "whatsappNumber"
              ? leadErrors.whatsapp
              : leadErrors.required;
          setLeadError(field, errorMessage);
          isValid = false;
        }
      });

      if (telegramId && telegramId.length < 3) {
        setLeadError("telegramId", leadErrors.telegram);
        isValid = false;
      }

      if (whatsappNumber && whatsappNumber.length < 3) {
        setLeadError("whatsappNumber", leadErrors.whatsapp);
        isValid = false;
      }
    }

    return isValid;
  };

  const goLeadNext = () => {
    if (!validateLeadStep()) return;
    leadStepIndex = Math.min(leadStepIndex + 1, leadStepKeys.length - 1);
    renderLeadStep();
  };

  const goLeadBack = () => {
    leadStepIndex = Math.max(leadStepIndex - 1, 0);
    renderLeadStep();
  };

  const handleLeadChoice = (button) => {
    const name = button.dataset.choice;
    const value = button.dataset.value;

    if (button.dataset.multiple === "true") {
      const currentValues = Array.isArray(leadState[name]) ? leadState[name] : [];
      leadState[name] = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      if (name === "regions") {
        if (value === "not_sure" && leadState.regions.includes("not_sure")) {
          leadState.regions = ["not_sure"];
        } else if (leadState.regions.includes("not_sure")) {
          leadState.regions = leadState.regions.filter((item) => item !== "not_sure");
        }
        leadState.regions = leadState.regions.filter((item) => geoRegionKeys.includes(item));
        updateGeoCountryPicker();
      }
      setLeadError(name, "");
      syncLeadSelections();
      return;
    }

    leadState[name] = value;

    if (name === "projectStage") {
      delete leadState.activeLaunch;
      delete leadState.livePlan;
    }

    setLeadError(name, "");
    syncLeadSelections();
    window.clearTimeout(leadAutoAdvanceTimer);
    leadAutoAdvanceTimer = window.setTimeout(goLeadNext, 180);
  };

  const buildLeadPayload = () => {
    syncWhatsappNumber();
    const data = Object.fromEntries(new FormData(leadForm).entries());
    const launchTimingCode = leadState.projectStage === "development" ? leadState.livePlan : leadState.activeLaunch;
    const sourceCode = String(data.source || "").trim();
    const telegramId = String(data.telegramId || "").trim();
    const whatsappNumber = String(data.whatsappNumber || "").trim();
    const countries = String(syncGeoCountriesInput() || data.countries || leadState.countries || "").trim();
    const regions = getSelectedRegions()
      .map((region) => canonicalLeadValues.regions[region] || region)
      .join(", ");
    const basePayload = {
      name: String(data.name || "").trim(),
      telegramId,
      whatsappNumber,
      contact: [telegramId, whatsappNumber].filter(Boolean).join(" / "),
      countries,
      source: canonicalLeadValues.source[sourceCode] || sourceCode,
      message: String(data.message || "").trim(),
      company_website: String(data.company_website || "").trim(),
      privacyConsent: data.privacyConsent === "true",
      pageUrl: window.location.href,
      language: getCurrentLanguage(),
      createdAt: new Date().toISOString()
    };

    if (leadMode === "referral") {
      return {
        leadType: leadTypes.referral,
        stage: "",
        launchTiming: "",
        projectType: "",
        regions: "",
        countries: "",
        activeProjects: "",
        ggr: "",
        ...basePayload
      };
    }

    return {
      leadType: leadTypes.integration,
      stage: canonicalLeadValues.projectStage[leadState.projectStage] || "",
      launchTiming: canonicalLeadValues.activeLaunch[launchTimingCode] || canonicalLeadValues.livePlan[launchTimingCode] || "",
      projectType: canonicalLeadValues.projectType[leadState.projectType] || "",
      regions,
      activeProjects: canonicalLeadValues.activeProjects[leadState.activeProjects] || "",
      ggr: canonicalLeadValues.ggr[leadState.ggr] || "",
      ...basePayload
    };
  };

  const saveFailedLeadPayload = (payload) => {
    let failedPayloads = [];
    try {
      failedPayloads = JSON.parse(localStorage.getItem(failedLeadStorageKey) || "[]");
      if (!Array.isArray(failedPayloads)) failedPayloads = [];
    } catch (error) {
      failedPayloads = [];
    }
    failedPayloads.push({
      ...payload,
      failedAt: new Date().toISOString()
    });
    localStorage.setItem(failedLeadStorageKey, JSON.stringify(failedPayloads.slice(-10)));
  };

  const loadTurnstile = () => new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }

    const existingScript = document.querySelector('script[data-turnstile-script]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = "true";
      script.onerror = () => reject(new Error("Turnstile failed to load"));
      document.head.appendChild(script);
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(timer);
        resolve(window.turnstile);
        return;
      }

      if (Date.now() - startedAt > 10000) {
        window.clearInterval(timer);
        reject(new Error("Turnstile failed to load"));
      }
    }, 100);
  });

  const renderTurnstile = async () => {
    if (turnstileWidgetId !== null) return turnstileWidgetId;
    if (!turnstileSiteKey) throw new Error("Turnstile site key is not configured");
    if (!turnstileContainer) throw new Error("Turnstile container is missing");

    const turnstile = await loadTurnstile();
    turnstileWidgetId = turnstile.render(turnstileContainer, {
      sitekey: turnstileSiteKey,
      size: "invisible",
      callback: (token) => {
        pendingTurnstileChallenge?.resolve(token);
        pendingTurnstileChallenge = null;
      },
      "error-callback": () => {
        pendingTurnstileChallenge?.reject(new Error("Turnstile verification failed"));
        pendingTurnstileChallenge = null;
      },
      "expired-callback": () => {
        pendingTurnstileChallenge?.reject(new Error("Turnstile token expired"));
        pendingTurnstileChallenge = null;
      }
    });

    return turnstileWidgetId;
  };

  const getTurnstileToken = async () => {
    const turnstile = await loadTurnstile();
    const widgetId = await renderTurnstile();

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (pendingTurnstileChallenge) {
          pendingTurnstileChallenge = null;
          reject(new Error("Turnstile verification timed out"));
        }
      }, 15000);

      pendingTurnstileChallenge = {
        resolve: (token) => {
          window.clearTimeout(timeout);
          resolve(token);
        },
        reject: (error) => {
          window.clearTimeout(timeout);
          reject(error);
        }
      };

      turnstile.reset(widgetId);
      turnstile.execute(widgetId);
    });
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();
    if (!validateLeadStep()) return;

    leadSubmit.disabled = true;
    leadSubmit.setAttribute("aria-busy", "true");
    if (leadSubmitError) leadSubmitError.hidden = true;

    try {
      if (!leadEndpointUrl) {
        throw new Error("Lead endpoint URL is not configured");
      }

      const turnstileToken = await getTurnstileToken();
      const payload = {
        ...buildLeadPayload(),
        turnstileToken
      };

      const response = await fetch(leadEndpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();

      if (!response.ok) {
        let message = responseText || "Lead request failed with status " + response.status;
        try {
          message = JSON.parse(responseText).error || message;
        } catch {
          // Keep the raw response text when the backend returns non-JSON.
        }
        throw new Error(message);
      }

      leadState = {};
      leadForm.reset();
      resetPhoneInput();
      syncWhatsappNumber();
      leadSubmit.disabled = false;
      leadSubmit.removeAttribute("aria-busy");
      leadContent.hidden = true;
      leadSuccess.hidden = false;
      $("[data-lead-close]", leadSuccess)?.focus();
    } catch (error) {
      console.error("[lead-submit-error]", error);
      saveFailedLeadPayload(buildLeadPayload());
      leadSubmit.disabled = !isLeadContactComplete();
      leadSubmit.removeAttribute("aria-busy");
      if (leadSubmitError) {
        leadSubmitError.textContent = `${t("lead_submit_error_prefix")} ${error.message || error}. ${t("lead_submit_error_suffix")}`;
        leadSubmitError.hidden = false;
        leadSubmitError.focus?.();
      }
    }
  };

  $$('[data-lead-open]').forEach((button) => {
    button.addEventListener("click", () => {
      navLinks?.classList.remove("open");
      openLeadModal();
    });
  });

  $$('[data-referral-open]').forEach((button) => {
    button.addEventListener("click", openReferralPopup);
  });

  $$('[data-lead-close]').forEach((button) => {
    button.addEventListener("click", closeLeadModal);
  });

  leadModal?.addEventListener("click", (event) => {
    if (event.target === leadModal) closeLeadModal();
  });

  leadForm?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const geoTrigger = target.closest("[data-geo-trigger]");
    if (geoTrigger) {
      const { panel } = getGeoElements();
      if (panel?.hidden) openGeoPanel();
      else closeGeoPanel();
      return;
    }

    const geoRemove = target.closest("[data-geo-remove]");
    if (geoRemove) {
      leadState.countryIsos = getSelectedCountryIsos().filter((iso) => iso !== geoRemove.dataset.geoRemove);
      renderGeoSelectedTags();
      syncGeoCountriesInput();
      renderGeoCountryOptions(getGeoElements().search?.value || "");
      setLeadError("countries", "");
      return;
    }

    const countryTrigger = target.closest("[data-country-trigger]");
    if (countryTrigger) {
      const { panel } = getPhoneElements();
      if (panel?.hidden) openCountryPanel();
      else closeCountryPanel();
      return;
    }

    const countryOption = target.closest("[data-country-iso]");
    if (countryOption) {
      const country = phoneCountries.find((item) => item.iso === countryOption.dataset.countryIso);
      setPhoneCountry(country, { focusLocal: true });
      if (leadSubmit && getLeadStepKey() === "contacts") {
        leadSubmit.disabled = !isLeadContactComplete();
      }
      return;
    }

    const choice = target.closest("[data-choice]");
    if (choice) handleLeadChoice(choice);
  });

  leadForm?.addEventListener("input", (event) => {
    const target = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement
      ? event.target
      : null;
    if (!target) return;
    if (target.matches("[data-country-search]")) {
      renderCountryOptions(target.value);
      return;
    }
    if (target.matches("[data-geo-search]")) {
      renderGeoCountryOptions(target.value);
      return;
    }
    if (target.name === "whatsappLocalNumber") {
      parseInternationalPhoneInput();
      syncWhatsappNumber();
      setLeadError("whatsappNumber", "");
    }
    if (target.name) setLeadError(target.name, "");
    if (target.name === "countries") {
      leadState.countries = String(target.value || "").trim();
    }
    if (getLeadStepKey() === "contacts" && leadSubmit) {
      leadSubmit.disabled = !isLeadContactComplete();
    }
  });

  leadForm?.addEventListener("change", (event) => {
    const target = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement
      ? event.target
      : null;
    if (!target) return;
    if (target.name === "whatsappLocalNumber") {
      parseInternationalPhoneInput();
      syncWhatsappNumber();
      setLeadError("whatsappNumber", "");
    }
    if (target.matches("[data-geo-country-iso]")) {
      const selectedIsoSet = new Set(getSelectedCountryIsos());
      if (target.checked) selectedIsoSet.add(target.dataset.geoCountryIso);
      else selectedIsoSet.delete(target.dataset.geoCountryIso);
      leadState.countryIsos = [...selectedIsoSet];
      renderGeoSelectedTags();
      syncGeoCountriesInput();
      renderGeoCountryOptions(getGeoElements().search?.value || "");
      setLeadError("countries", "");
      return;
    }
    if (target.matches("[data-geo-select-all]")) {
      const availableCountries = getAvailableGeoCountries();
      const query = getGeoElements().search?.value || "";
      const normalizedQuery = query.trim().toLowerCase();
      const visibleCountries = availableCountries.filter((country) => !normalizedQuery || country.searchText.includes(normalizedQuery));
      const selectedIsoSet = new Set(getSelectedCountryIsos());
      if (target.checked) {
        visibleCountries.forEach((country) => selectedIsoSet.add(country.iso));
      } else {
        visibleCountries.forEach((country) => selectedIsoSet.delete(country.iso));
      }
      leadState.countryIsos = [...selectedIsoSet];
      renderGeoSelectedTags();
      syncGeoCountriesInput();
      renderGeoCountryOptions(query);
      setLeadError("countries", "");
      return;
    }
    if (target.name) setLeadError(target.name, "");
    if (getLeadStepKey() === "contacts" && leadSubmit) {
      leadSubmit.disabled = !isLeadContactComplete();
    }
  });

  document.addEventListener("click", (event) => {
    if (!leadForm || !leadModal?.classList.contains("open")) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest("[data-country-combobox]")) closeCountryPanel();
    if (!target?.closest("[data-geo-picker]")) closeGeoPanel();
  });

  window.addEventListener("api-lx-language-change", () => {
    updateGeoCountryPicker();
    renderLeadStep();
  });

  leadNext?.addEventListener("click", goLeadNext);
  leadBack?.addEventListener("click", goLeadBack);
  leadForm?.addEventListener("submit", handleLeadSubmit);

  window.addEventListener("keydown", (event) => {
    if (!leadModal?.classList.contains("open")) return;
    if (event.key === "Escape") closeLeadModal();
    if (event.key !== "Tab") return;

    const focusable = getFocusableLeadElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  $("[data-year]").textContent = new Date().getFullYear();
  window.dispatchEvent(new CustomEvent("api-lx:partials-ready"));

  if (window.location.hash) {
    window.setTimeout(() => {
      const hashTargetId = decodeURIComponent(window.location.hash.slice(1));
      const target = hashTargetId ? document.getElementById(hashTargetId) : null;
      if (target) scrollToSectionHeading(target, { behavior: "auto" });
    }, 80);
  } else {
    window.API_LX_FORCE_HERO_START?.({ repeat: true });
  }
  }

  loadPartials().then(initApp).catch((error) => {
    console.error(error);
    window.API_LX_FINISH_BOOT?.();
  });
})();
