window.API_LX_LANGUAGE = (() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const translations = window.API_LX_TRANSLATIONS || {};

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
    if (!langToggle || !langMenu || !languageModal || !languageGrid || !languageClose || !currentLang) {
      applyStaticLanguage();
      return { closeLanguageMenu() {}, closeLanguageModal() {}, applyLanguage: applyStaticLanguage };
    }

    const languageMeta = [
    { code: "en", native: "English", label: "English", flag: "\ud83c\uddec\ud83c\udde7" },
    { code: "ru", native: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", label: "Russian", flag: "\ud83c\uddf7\ud83c\uddfa" },
    { code: "es", native: "Espa\u00f1ol", label: "Spanish", flag: "\ud83c\uddea\ud83c\uddf8" },
    { code: "hi", native: "\u0939\u093f\u0928\u094d\u0926\u0940", label: "Hindi", flag: "\ud83c\uddee\ud83c\uddf3" },
    { code: "pt", native: "Portugu\u00eas", label: "Portuguese", flag: "\ud83c\uddf5\ud83c\uddf9" },
    { code: "br", native: "Portugu\u00eas", label: "Brazilian Portuguese", flag: "\ud83c\udde7\ud83c\uddf7" },
    { code: "de", native: "Deutsch", label: "German", flag: "\ud83c\udde9\ud83c\uddea" },
    { code: "it", native: "Italiano", label: "Italian", flag: "\ud83c\uddee\ud83c\uddf9" },
    { code: "zh", native: "\u4e2d\u56fd", label: "Chinese", flag: "\ud83c\udde8\ud83c\uddf3" },
    { code: "fr", native: "Fran\u00e7ais", label: "French", flag: "\ud83c\uddeb\ud83c\uddf7" },
    { code: "ka", native: "\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8", label: "Georgian", flag: "\ud83c\uddec\ud83c\uddea" },
    { code: "th", native: "\u0e44\u0e17\u0e22", label: "Thai", flag: "\ud83c\uddf9\ud83c\udded" },
    { code: "ko", native: "\ud55c\uad6d\uc778", label: "Korean", flag: "\ud83c\uddf0\ud83c\uddf7" },
    { code: "vi", native: "Ti\u1ebfng Vi\u1ec7t", label: "Vietnamese", flag: "\ud83c\uddfb\ud83c\uddf3" },
    { code: "sr", native: "\u0421\u0440\u043f\u0441\u043a\u0438", label: "Serbian", flag: "\ud83c\uddf7\ud83c\uddf8" },
    { code: "tr", native: "Türkçe", label: "Turkish", flag: "\ud83c\uddf9\ud83c\uddf7" }
  ];

  const languageLabels = languageMeta;
  ["tr", "de", "it", "ka", "th", "ko", "vi", "sr"].forEach((code) => {
    translations[code] = {
      ...translations.en,
      ...(translations[code] || {})
    };
  });

  translations.br = {
    ...translations.en,
    ...(translations.pt || {})
  };

  languageGrid.innerHTML = languageMeta.map((language) => `
    <button class="language-card" type="button" data-lang="${language.code}">
      <span class="language-card-label"><span class="language-flag" aria-hidden="true">${language.flag}</span><strong>${language.native}</strong></span>
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

    const applyLanguage = (lang) => {
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
      currentLang.textContent = `${selected.flag} ${selected.native}`;
      $$("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === lang));
      localStorage.setItem("api-lx-language", lang);
      window.dispatchEvent(new CustomEvent("api-lx-language-change", { detail: { lang } }));
      document.body.classList.remove("is-translating");
    }, 120);
  };

    langToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = langMenu.classList.toggle("open");
      langToggle.setAttribute("aria-expanded", String(isOpen));
    });

    $("[data-open-lang-modal]").addEventListener("click", openLanguageModal);

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
