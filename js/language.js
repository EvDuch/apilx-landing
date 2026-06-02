window.API_LX_LANGUAGE = (() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const translations = window.API_LX_TRANSLATIONS || {};
  const supportedLanguages = ["en", "ru", "fr", "es", "pt"];
  const normalizeLanguage = (lang) => supportedLanguages.includes(lang) ? lang : "en";

  function applyDocumentMetadata(dictionary) {
    const titleKey = document.documentElement.dataset.titleKey;
    if (titleKey && dictionary[titleKey]) document.title = dictionary[titleKey];
    const metaDescription = $("meta[name=\"description\"]");
    const descriptionKey = document.documentElement.dataset.descriptionKey;
    if (metaDescription && descriptionKey && dictionary[descriptionKey]) {
      metaDescription.setAttribute("content", dictionary[descriptionKey]);
    }
  }

  function applyStaticLanguage(lang = localStorage.getItem("api-lx-language") || "en") {
    lang = normalizeLanguage(lang);
    const dictionary = { ...translations.en, ...(translations[lang] || {}) };
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach((el) => {
      const value = dictionary[el.dataset.i18n] || translations.en?.[el.dataset.i18n];
      if (value) el.textContent = value;
    });
    $$("[data-i18n-placeholder]").forEach((el) => {
      const value = dictionary[el.dataset.i18nPlaceholder] || translations.en?.[el.dataset.i18nPlaceholder];
      if (value) el.setAttribute("placeholder", value);
    });
    $$("[data-i18n-aria-label]").forEach((el) => {
      const value = dictionary[el.dataset.i18nAriaLabel] || translations.en?.[el.dataset.i18nAriaLabel];
      if (value) el.setAttribute("aria-label", value);
    });
    applyDocumentMetadata(dictionary);
    window.dispatchEvent(new CustomEvent("api-lx-language-change", { detail: { lang } }));
  }

  function initLanguageSystem({ modal, closeModal }) {
    const langToggle = $("[data-lang-toggle]");
    const langMenu = $("[data-lang-menu]");
    const languageModal = $("[data-language-modal]");
    const languageGrid = $("[data-language-grid]");
    const languageClose = $("[data-language-close]");
    const currentLang = $("[data-current-lang]");
    const currentLangFlag = $("[data-current-lang-flag]");
    if (!langToggle || !langMenu || !languageModal || !languageGrid || !languageClose || !currentLang) {
      applyStaticLanguage();
      return { closeLanguageMenu() {}, closeLanguageModal() {}, applyLanguage: applyStaticLanguage };
    }

    const languageMeta = [
    { code: "en", native: "English", label: "English", flagSrc: "assets/flags/flag-en.png?v=20260602" },
    { code: "ru", native: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", label: "Russian", flagSrc: "assets/flags/flag-ru.png?v=20260602" },
    { code: "fr", native: "Fran\u00e7ais", label: "French", flagSrc: "assets/flags/flag-fr.png?v=20260602" },
    { code: "es", native: "Espa\u00f1ol", label: "Spanish", flagSrc: "assets/flags/flag-es.png?v=20260602" },
    { code: "pt", native: "Portugu\u00eas", label: "Portuguese", flagSrc: "assets/flags/flag-pt.png?v=20260602-portugal" }
  ];

  const languageLabels = languageMeta;

  languageGrid.innerHTML = languageMeta.map((language) => `
    <button class="language-card" type="button" data-lang="${language.code}">
      <span class="language-card-label"><img class="language-flag language-flag-image" src="${language.flagSrc}" alt="" aria-hidden="true" /><strong>${language.native}</strong></span>
      <span class="language-chevron" aria-hidden="true">›</span>
    </button>
  `).join("");

  $$("[data-i18n]").forEach((el) => {
    translations.en[el.dataset.i18n] ||= el.textContent.trim();
  });
  $$("[data-i18n-placeholder]").forEach((el) => {
    translations.en[el.dataset.i18nPlaceholder] ||= el.getAttribute("placeholder") || "";
  });
  $$("[data-i18n-aria-label]").forEach((el) => {
    translations.en[el.dataset.i18nAriaLabel] ||= el.getAttribute("aria-label") || "";
  });

  const closeLanguageMenu = () => {
    langMenu.classList.remove("open");
    langToggle.setAttribute("aria-expanded", "false");
  };

  const openLanguageModal = () => {
    languageModal.classList.add("open");
    languageModal.setAttribute("aria-hidden", "false");
    closeLanguageMenu();
    document.body.style.overflow = "hidden";
  };

  const closeLanguageModal = () => {
    languageModal.classList.remove("open");
    languageModal.setAttribute("aria-hidden", "true");
    if (!modal.classList.contains("open")) document.body.style.overflow = "";
  };

    const setCurrentLanguageLabel = (selected) => {
      currentLang.textContent = selected.native;
      if (currentLangFlag) {
        currentLangFlag.src = selected.flagSrc;
        currentLangFlag.alt = selected.label;
      }
      langToggle.setAttribute("aria-label", selected.label);
    };

    const applyLanguage = (lang) => {
      lang = normalizeLanguage(lang);
      const selected = languageLabels.find((language) => language.code === lang) || languageLabels[0];
    const dictionary = { ...translations.en, ...(translations[lang] || {}) };
    document.body.classList.add("is-translating");
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    window.setTimeout(() => {
      $$("[data-i18n]").forEach((el) => {
        const value = dictionary[el.dataset.i18n] || translations.en[el.dataset.i18n];
        if (value) el.textContent = value;
      });
      $$("[data-i18n-placeholder]").forEach((el) => {
        const value = dictionary[el.dataset.i18nPlaceholder] || translations.en[el.dataset.i18nPlaceholder];
        if (value) el.setAttribute("placeholder", value);
      });
      $$("[data-i18n-aria-label]").forEach((el) => {
        const value = dictionary[el.dataset.i18nAriaLabel] || translations.en[el.dataset.i18nAriaLabel];
        if (value) el.setAttribute("aria-label", value);
      });
      applyDocumentMetadata(dictionary);
      setCurrentLanguageLabel(selected);
      $$("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === lang));
      localStorage.setItem("api-lx-language", lang);
      window.dispatchEvent(new CustomEvent("api-lx-language-change", { detail: { lang } }));
      document.body.classList.remove("is-translating");
    }, 120);
  };

    window.addEventListener("resize", () => {
      const selected = languageLabels.find((language) => language.code === normalizeLanguage(localStorage.getItem("api-lx-language") || document.documentElement.lang)) || languageLabels[0];
      setCurrentLanguageLabel(selected);
    });

    langToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = langMenu.classList.toggle("open");
      langToggle.setAttribute("aria-expanded", String(isOpen));
    });

    $("[data-open-lang-modal]")?.addEventListener("click", openLanguageModal);

    $$(".language-menu [data-lang]").forEach((button) => {
      button.addEventListener("click", () => {
        applyLanguage(button.dataset.lang);
        closeLanguageMenu();
        closeLanguageModal();
      });
    });

    languageGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lang]");
      if (!button) return;
      applyLanguage(button.dataset.lang);
      closeLanguageModal();
    });

    languageClose.addEventListener("click", closeLanguageModal);
    languageModal.addEventListener("click", (event) => {
      if (event.target === languageModal) closeLanguageModal();
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".language-switcher")) {
        closeLanguageMenu();
      }
    });

    applyLanguage(localStorage.getItem("api-lx-language") || "en");
    return { closeLanguageMenu, closeLanguageModal, applyLanguage };
  }

  return { initLanguageSystem, applyStaticLanguage };
})();
