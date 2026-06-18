(() => {
  "use strict";

  const PAGE_SIZE = 40;
  const PRAGMATIC_DEMO_BASE_URL = "https://demogamesfree.pragmaticplay.net/hub-demo/openGame.do";
  const PRAGMATIC_CLIENT_HUB_URL = "https://clienthub.pragmaticplay.com/";
  const PRAGMATIC_LOBBY_URL = "https://clienthub.pragmaticplay.com/slots/game-library/";
  const PGSOFT_DEMO_BASE_URL = "https://public.pg-demo.com/demo/";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const getCurrentLanguage = () => {
    try {
      return window.API_LX_LANGUAGE?.getCurrentLanguage?.()
        || document.documentElement.lang
        || localStorage.getItem("api-lx-language")
        || "en";
    } catch {
      return document.documentElement.lang || "en";
    }
  };

  const t = (key, replacements = {}) => {
    const dictionaries = window.API_LX_TRANSLATIONS || {};
    const lang = getCurrentLanguage();
    const dictionary = { ...(dictionaries.en || {}), ...(dictionaries[lang] || {}) };
    const value = dictionary[key] || dictionaries.en?.[key] || key;
    return Object.entries(replacements).reduce(
      (text, [token, replacement]) => text.replaceAll(`{${token}}`, String(replacement)),
      value
    );
  };

  const getDemoLanguageParam = () => ({
    en: "en",
    ru: "ru",
    fr: "fr",
    es: "es",
    pt: "pt"
  }[getCurrentLanguage()] || "en");

  const getProviderLabel = (providerKey) => {
    const keyMap = {
      all: "demo_provider_all",
      pragmatic: "provider_pragmatic",
      pgsoft: "provider_pgsoft"
    };
    return t(keyMap[providerKey] || keyMap.all);
  };

  const els = {
    body: document.body,
    catalogView: $("[data-catalog-view]"),
    playerView: $("[data-player-view]"),
    grid: $("[data-game-grid]"),
    search: $("[data-game-search]"),
    total: $("[data-total-games]"),
    visible: $$("[data-visible-games]"),
    status: $("[data-catalog-status]"),
    loadMore: $("[data-load-more]"),
    loadMoreWrap: $("[data-load-more-wrap]"),
    frame: $("[data-game-frame]"),
    frameLoader: $("[data-frame-loader]"),
    frameTitle: $("[data-frame-title]"),
    frameProvider: $("[data-frame-provider]"),
    backToGames: $("[data-back-to-games]"),
    providerBadge: $("[data-provider-badge]"),
    providerName: $("[data-provider-name]"),
    pageTitle: $("[data-page-title]"),
    pageSubtitle: $("[data-page-subtitle]"),
    providerFilters: $$("[data-provider-filter]")
  };

  const providers = {
    pragmatic: {
      key: "pragmatic",
      dataUrl: "./data/pragmatic-games.json",
      displayName: "Pragmatic Play",
      shortName: "Pragmatic",
      errorKey: "demo_load_error_pragmatic",
      missingKey: "demo_missing_pragmatic_symbol",
      normalize: (game, index) => ({
        id: `pragmatic-${game.symbol || index}`,
        providerKey: "pragmatic",
        provider: String(game.vendorid || "Pragmatic Play").trim(),
        title: String(game.name || t("demo_untitled_game")).trim(),
        symbol: String(game.symbol || "").trim(),
        gameId: String(game.gameid || "").trim(),
        launchValue: String(game.symbol || "").trim(),
        image: String(game.iconurl2 || game.iconurl1 || "").trim(),
        fallbackImage: String(game.iconurl1 || "").trim(),
        miniBet: game.miniBet
      }),
      buildDemoUrl: (game) => {
        if (!game.launchValue) throw new Error(t("demo_missing_pragmatic_symbol"));
        const params = [
          `lang=${encodeURIComponent(getDemoLanguageParam())}`,
          "cur=USD",
          `websiteUrl=${encodeURIComponent(PRAGMATIC_CLIENT_HUB_URL)}`,
          "gcpif=2831",
          `gameSymbol=${encodeURIComponent(game.launchValue)}`,
          "jurisdiction=99",
          `lobbyUrl=${PRAGMATIC_LOBBY_URL}`
        ];

        return `${PRAGMATIC_DEMO_BASE_URL}?${params.join("&")}`;
      }
    },
    pgsoft: {
      key: "pgsoft",
      dataUrl: "./data/PGSoft.json",
      displayName: "PG Soft",
      shortName: "PG Soft",
      errorKey: "demo_load_error_pgsoft",
      missingKey: "demo_missing_pgsoft_gameid",
      normalize: (game, index) => ({
        id: `pgsoft-${game.gameid || game.symbol || index}`,
        providerKey: "pgsoft",
        provider: String(game.vendorid || "PG Soft").trim(),
        title: String(game.name || t("demo_untitled_game")).trim(),
        symbol: String(game.symbol || "").trim(),
        gameId: String(game.gameid || "").trim(),
        launchValue: String(game.gameid || "").trim(),
        image: String(game.iconurl || "").trim(),
        fallbackImage: "",
        miniBet: game.miniBet
      }),
      buildDemoUrl: (game) => {
        if (!game.launchValue) throw new Error(t("demo_missing_pgsoft_gameid"));
        return `${PGSOFT_DEMO_BASE_URL}?gi=${encodeURIComponent(game.launchValue)}&lang=${encodeURIComponent(getDemoLanguageParam())}`;
      }
    }
  };

  let games = [];
  let providerScopedGames = [];
  let filteredGames = [];
  let activeProvider = "all";
  let renderedCount = PAGE_SIZE;
  let loadErrors = [];
  let frameLoadingTimer = 0;

  const getInitialProvider = () => {
    const params = new URLSearchParams(window.location.search);
    const provider = String(params.get("provider") || params.get("vendor") || "all").toLowerCase();
    if (["pragmatic", "pragmatic-play", "pragmatic_play"].includes(provider)) return "pragmatic";
    if (["pgsoft", "pg-soft", "pg_soft", "pg"].includes(provider)) return "pgsoft";
    return "all";
  };

  const placeholderImage = (title = t("demo_placeholder_game")) => {
    const initials = title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "LX";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="650" height="520" viewBox="0 0 650 520">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#122a65"/>
            <stop offset="1" stop-color="#120926"/>
          </linearGradient>
        </defs>
        <rect width="650" height="520" rx="28" fill="url(#bg)"/>
        <circle cx="520" cy="90" r="140" fill="#2ed2ff" opacity=".16"/>
        <circle cx="92" cy="440" r="170" fill="#ff4fc3" opacity=".16"/>
        <text x="50%" y="49%" dominant-baseline="middle" text-anchor="middle" font-family="Comfortaa, sans-serif" font-size="112" font-weight="700" fill="#fff">${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const formatMiniBet = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    const localeMap = { en: "en-US", ru: "ru-RU", fr: "fr-FR", es: "es-ES", pt: "pt-PT" };
    return new Intl.NumberFormat(localeMap[getCurrentLanguage()] || "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: number % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const setStatus = (message, isError = false) => {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.hidden = !message;
    els.status.classList.toggle("is-error", isError);
  };

  const providerMatches = (game) => activeProvider === "all" || game.providerKey === activeProvider;

  const updateProviderUi = () => {
    const label = getProviderLabel(activeProvider);
    if (els.providerBadge) {
      els.providerBadge.textContent = activeProvider === "all"
        ? t("demo_provider_badge_all")
        : t("demo_provider_badge_provider", { provider: label });
    }
    if (els.providerName) els.providerName.textContent = label;
    if (els.pageTitle) {
      els.pageTitle.textContent = activeProvider === "all"
        ? t("demo_page_heading_all")
        : t("demo_page_heading_provider", { provider: label });
    }
    if (els.pageSubtitle) {
      els.pageSubtitle.textContent = activeProvider === "all"
        ? t("demo_page_subtitle_all")
        : t("demo_page_subtitle_provider", { provider: label });
    }
    if (els.search) {
      const placeholderKey = activeProvider === "pgsoft"
        ? "demo_search_placeholder_pgsoft"
        : activeProvider === "pragmatic"
          ? "demo_search_placeholder_pragmatic"
          : "demo_search_placeholder_all";
      els.search.setAttribute("placeholder", t(placeholderKey));
    }
    els.providerFilters.forEach((button) => {
      const isActive = button.dataset.providerFilter === activeProvider;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const setTotals = () => {
    providerScopedGames = games.filter(providerMatches);
    if (els.total) els.total.textContent = providerScopedGames.length.toString();
    els.visible.forEach((node) => {
      node.textContent = Math.min(renderedCount, filteredGames.length).toString();
    });
  };

  const createGameCard = (game) => {
    const card = document.createElement("article");
    card.className = "game-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "game-art";

    const img = document.createElement("img");
    img.src = game.image || placeholderImage(game.title);
    img.alt = game.title;
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 650;
    img.height = 520;
    img.dataset.fallback = game.fallbackImage || "";
    img.addEventListener("error", () => {
      const fallback = img.dataset.fallback;
      if (fallback) {
        img.removeAttribute("data-fallback");
        img.src = fallback;
        return;
      }
      if (img.dataset.placeholderApplied === "true") return;
      img.dataset.placeholderApplied = "true";
      img.src = placeholderImage(game.title);
    });

    imageWrap.append(img);

    const body = document.createElement("div");
    body.className = "game-body";

    const provider = document.createElement("span");
    provider.className = "provider";
    provider.textContent = getProviderLabel(game.providerKey);

    const title = document.createElement("h3");
    title.textContent = game.title;

    const meta = document.createElement("div");
    meta.className = "game-meta";

    const launchId = document.createElement("span");
    launchId.textContent = game.providerKey === "pgsoft"
      ? t("demo_game_id", { id: game.launchValue })
      : game.symbol;
    meta.append(launchId);

    const miniBet = formatMiniBet(game.miniBet);
    if (miniBet) {
      const bet = document.createElement("span");
      bet.textContent = t("demo_min_bet", { value: miniBet });
      meta.append(bet);
    }

    const button = document.createElement("button");
    button.className = "play-button";
    button.type = "button";
    button.textContent = t("demo_play_demo");
    button.disabled = !game.launchValue;
    button.addEventListener("click", () => openGame(game));

    body.append(provider, title, meta, button);
    card.append(imageWrap, body);
    return card;
  };

  const applyFilters = () => {
    const query = (els.search?.value || "").trim().toLowerCase();
    providerScopedGames = games.filter(providerMatches);
    filteredGames = providerScopedGames.filter((game) => !query || game.title.toLowerCase().includes(query));
    renderedCount = PAGE_SIZE;
    renderGames();
  };

  const renderGames = () => {
    if (!els.grid) return;

    els.grid.innerHTML = "";

    const visibleGames = filteredGames.slice(0, renderedCount);
    const fragment = document.createDocumentFragment();
    visibleGames.forEach((game) => fragment.append(createGameCard(game)));
    els.grid.append(fragment);

    if (loadErrors.length) {
      setStatus(loadErrors.join(" "), true);
    } else if (!filteredGames.length) {
      setStatus(t("demo_no_games"));
    } else {
      setStatus("");
    }

    if (els.loadMoreWrap && els.loadMore) {
      const hasMore = renderedCount < filteredGames.length;
      els.loadMoreWrap.hidden = !hasMore;
      els.loadMore.textContent = hasMore
        ? t("demo_load_more_left", { count: filteredGames.length - renderedCount })
        : t("demo_load_more");
    }

    setTotals();
  };

  const beginFrameLoading = () => {
    if (!els.frameLoader) return;
    window.clearTimeout(frameLoadingTimer);
    els.frameLoader.textContent = t("demo_frame_loading");
    els.frameLoader.hidden = false;
    els.frameLoader.classList.add("is-visible");
    frameLoadingTimer = window.setTimeout(() => {
      els.frameLoader.textContent = t("demo_frame_still_loading");
      els.frameLoader.hidden = false;
      els.frameLoader.classList.add("is-visible");
    }, 15000);
  };

  const finishFrameLoading = () => {
    window.clearTimeout(frameLoadingTimer);
    frameLoadingTimer = 0;
    if (!els.frameLoader) return;
    els.frameLoader.hidden = true;
    els.frameLoader.classList.remove("is-visible");
  };

  const scrollToPlayer = () => {
    window.requestAnimationFrame(() => {
      const target = els.playerView?.querySelector(".player-shell") || els.playerView;
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 14;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  function openGame(game) {
    if (!game.launchValue || !els.frame || !els.playerView || !els.catalogView) return;

    let demoUrl = "";
    try {
      demoUrl = providers[game.providerKey].buildDemoUrl(game);
    } catch (error) {
      setStatus(error.message || t("demo_not_available"), true);
      return;
    }

    if (els.frameTitle) els.frameTitle.textContent = game.title;
    if (els.frameProvider) els.frameProvider.textContent = getProviderLabel(game.providerKey);
    setStatus("");
    beginFrameLoading();
    els.frame.src = demoUrl;
    els.catalogView.hidden = true;
    els.playerView.hidden = false;
    els.body.classList.add("is-playing-demo");
    scrollToPlayer();
  }

  const closeGame = () => {
    if (!els.frame || !els.playerView || !els.catalogView) return;

    els.frame.src = "about:blank";
    els.playerView.hidden = true;
    els.catalogView.hidden = false;
    els.body.classList.remove("is-playing-demo");
    finishFrameLoading();
    window.scrollTo({ top: els.catalogView.offsetTop, behavior: "smooth" });
  };

  const loadProvider = async (providerConfig) => {
    const response = await fetch(providerConfig.dataUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`${t(providerConfig.errorKey)} HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload?.data)) throw new Error(`${t(providerConfig.errorKey)} ${t("demo_invalid_data")}`);
    return payload.data
      .map(providerConfig.normalize)
      .filter((game) => game.title && game.launchValue);
  };

  const loadGames = async () => {
    setStatus(t("demo_catalog_loading"));

    const results = await Promise.allSettled(Object.values(providers).map(loadProvider));
    loadErrors = [];
    games = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        games.push(...result.value);
        return;
      }
      const providerConfig = Object.values(providers)[index];
      loadErrors.push(result.reason?.message || t(providerConfig.errorKey));
    });

    applyFilters();
  };

  activeProvider = getInitialProvider();
  updateProviderUi();

  els.providerFilters.forEach((button) => {
    button.addEventListener("click", () => {
      activeProvider = button.dataset.providerFilter || "all";
      updateProviderUi();
      applyFilters();
    });
  });
  els.search?.addEventListener("input", applyFilters);
  els.loadMore?.addEventListener("click", () => {
    renderedCount += PAGE_SIZE;
    renderGames();
  });
  els.backToGames?.addEventListener("click", closeGame);
  els.frame?.addEventListener("load", finishFrameLoading);
  if (els.frame) els.frame.title = t("demo_iframe_title");

  window.addEventListener("api-lx-language-change", () => {
    updateProviderUi();
    if (els.frame) els.frame.title = t("demo_iframe_title");
    if (els.frameTitle && !els.body.classList.contains("is-playing-demo")) {
      els.frameTitle.textContent = t("demo_frame_title");
    }
    if (games.length) renderGames();
  });

  loadGames();
})();
