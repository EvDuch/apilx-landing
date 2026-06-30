window.API_LX_LANGUAGE = (() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const translations = window.API_LX_TRANSLATIONS || {};
  const supportedLanguages = ["en", "ru", "fr", "es", "pt", "ar"];
  const defaultLanguage = "en";
  const normalizeLanguage = (lang) => supportedLanguages.includes(lang) ? lang : "en";
  const assetBase = window.API_LX_ASSET_BASE || "";
  const arabicBadgeSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='32' fill='%230a1f56'/%3E%3Ctext x='32' y='39' text-anchor='middle' font-family='Arial,sans-serif' font-size='22' font-weight='800' fill='%23ffffff'%3EAR%3C/text%3E%3C/svg%3E";
  const resolveAssetUrl = (url = "") => /^(?:data:|https?:|\/)/.test(url) ? url : `${assetBase}${url}`;
  const isArabicPage = () => document.documentElement.dataset.pageLang === "ar"
    || /\/ar(?:\/|\/index\.html)?$/.test(window.location.pathname);
  const getProjectRootPath = () => {
    const path = window.location.pathname;
    const folderPath = path.endsWith("/") ? path : path.replace(/\/[^/]*$/, "/");
    const arIndex = folderPath.lastIndexOf("/ar/");
    if (arIndex >= 0) return folderPath.slice(0, arIndex + 1);
    return folderPath;
  };
  const buildLanguageUrl = (lang) => {
    const rootPath = getProjectRootPath();
    const targetPath = lang === "ar" ? `${rootPath}ar/` : rootPath;
    return `${targetPath}${window.location.search || ""}${window.location.hash || ""}`;
  };

  const readStoredLanguage = () => {
    if (isArabicPage()) return "ar";
    try {
      const stored = localStorage.getItem("api-lx-language");
      if (stored) {
        const normalized = normalizeLanguage(stored);
        if (normalized === "ar" && !isArabicPage()) {
          return normalizeLanguage(document.documentElement.lang || defaultLanguage);
        }
        return normalized;
      }
    } catch {
      /* Storage can be unavailable in strict browser modes. */
    }
    return normalizeLanguage(document.documentElement.lang || defaultLanguage);
  };

  const writeStoredLanguage = (lang = defaultLanguage) => {
    try {
      localStorage.setItem("api-lx-language", normalizeLanguage(lang));
    } catch {
      /* Storage can be unavailable in strict browser modes. */
    }
  };

  const setDocumentLanguage = (lang = defaultLanguage) => {
    const normalized = normalizeLanguage(lang);
    document.documentElement.lang = normalized;
    document.documentElement.dir = normalized === "ar" ? "rtl" : "ltr";
    return normalized;
  };

  setDocumentLanguage(readStoredLanguage());

  function applyDocumentMetadata(dictionary) {
    const titleKey = document.documentElement.dataset.titleKey;
    if (titleKey && dictionary[titleKey]) document.title = dictionary[titleKey];
    const metaDescription = $("meta[name=\"description\"]");
    const descriptionKey = document.documentElement.dataset.descriptionKey;
    if (metaDescription && descriptionKey && dictionary[descriptionKey]) {
      metaDescription.setAttribute("content", dictionary[descriptionKey]);
    }
  }

  function applyStaticLanguage(lang = readStoredLanguage()) {
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
      applyStaticLanguage(readStoredLanguage());
      return { closeLanguageMenu() {}, closeLanguageModal() {}, applyLanguage: applyStaticLanguage };
    }

    const languageMeta = [
    { code: "en", native: "English", label: "English", short: "EN", lang: "en", direction: "ltr", flagSrc: "assets/flags/flag-en.png?v=20260602" },
    { code: "ru", native: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", label: "Russian", short: "RU", lang: "ru", direction: "ltr", flagSrc: "assets/flags/flag-ru.png?v=20260602" },
    { code: "fr", native: "Fran\u00e7ais", label: "French", short: "FR", lang: "fr", direction: "ltr", flagSrc: "assets/flags/flag-fr.png?v=20260602" },
    { code: "es", native: "Espa\u00f1ol", label: "Spanish", short: "ES", lang: "es", direction: "ltr", flagSrc: "assets/flags/flag-es.png?v=20260602" },
    { code: "pt", native: "Portugu\u00eas", label: "Portuguese", short: "PT", lang: "pt", direction: "ltr", flagSrc: "assets/flags/flag-pt.png?v=20260602-portugal" },
    { code: "ar", native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", label: "Arabic", short: "AR", lang: "ar", direction: "rtl", flagSrc: arabicBadgeSrc }
  ];

  const languageLabels = languageMeta;

  languageGrid.innerHTML = languageMeta.map((language) => `
    <button class="language-card" type="button" data-lang="${language.code}" lang="${language.lang}" dir="${language.direction}">
      <span class="language-card-label"><img class="language-flag language-flag-image" src="${resolveAssetUrl(language.flagSrc)}" alt="" aria-hidden="true" /><strong>${language.native}</strong></span>
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
      currentLang.setAttribute("lang", selected.lang);
      currentLang.setAttribute("dir", selected.direction);
      if (currentLangFlag) {
        currentLangFlag.src = resolveAssetUrl(selected.flagSrc);
        currentLangFlag.alt = selected.label;
      }
      langToggle.setAttribute("aria-label", selected.label);
      langToggle.setAttribute("lang", selected.lang);
      langToggle.setAttribute("dir", selected.direction);
    };

    const applyLanguage = (lang) => {
      lang = normalizeLanguage(lang);
      if (lang === "ar" && !isArabicPage()) {
        writeStoredLanguage(lang);
        window.location.assign(buildLanguageUrl(lang));
        return;
      }
      if (lang !== "ar" && isArabicPage()) {
        writeStoredLanguage(lang);
        window.location.assign(buildLanguageUrl(lang));
        return;
      }
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
      writeStoredLanguage(lang);
      window.dispatchEvent(new CustomEvent("api-lx-language-change", { detail: { lang } }));
      document.body.classList.remove("is-translating");
    }, 120);
  };

    window.addEventListener("resize", () => {
      const selected = languageLabels.find((language) => language.code === normalizeLanguage(document.documentElement.lang || defaultLanguage)) || languageLabels[0];
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

    applyLanguage(readStoredLanguage());
    return { closeLanguageMenu, closeLanguageModal, applyLanguage };
  }

  return { initLanguageSystem, applyStaticLanguage, getCurrentLanguage: readStoredLanguage };
})();
