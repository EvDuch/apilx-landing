(() => {
  "use strict";

  const DATA_URL = "./data/pragmatic-games.json";
  const PAGE_SIZE = 40;
  const DEMO_BASE_URL = "https://demogamesfree.pragmaticplay.net/hub-demo/openGame.do";
  const CLIENT_HUB_URL = "https://clienthub.pragmaticplay.com/";
  const LOBBY_URL = "https://clienthub.pragmaticplay.com/slots/game-library/";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

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
    backToGames: $("[data-back-to-games]")
  };

  let games = [];
  let filteredGames = [];
  let renderedCount = PAGE_SIZE;

  const placeholderImage = (title = "Game") => {
    const initials = title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "PP";

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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: number % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const normalizeGame = (game, index) => ({
    id: `${game.symbol || "game"}-${index}`,
    title: String(game.name || "Untitled game").trim(),
    provider: String(game.vendorid || "Pragmatic Play").trim(),
    symbol: String(game.symbol || "").trim(),
    image: String(game.iconurl2 || game.iconurl1 || "").trim(),
    fallbackImage: String(game.iconurl1 || "").trim(),
    miniBet: game.miniBet
  });

  const buildDemoUrl = (symbol) => {
    const params = [
      "lang=en",
      "cur=USD",
      `websiteUrl=${encodeURIComponent(CLIENT_HUB_URL)}`,
      "gcpif=2831",
      `gameSymbol=${encodeURIComponent(symbol)}`,
      "jurisdiction=99",
      `lobbyUrl=${LOBBY_URL}`
    ];

    return `${DEMO_BASE_URL}?${params.join("&")}`;
  };

  const setStatus = (message, isError = false) => {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.hidden = !message;
    els.status.classList.toggle("is-error", isError);
  };

  const setTotals = () => {
    if (els.total) els.total.textContent = games.length.toString();
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
    provider.textContent = game.provider;

    const title = document.createElement("h3");
    title.textContent = game.title;

    const meta = document.createElement("div");
    meta.className = "game-meta";

    const symbol = document.createElement("span");
    symbol.textContent = game.symbol;
    meta.append(symbol);

    const miniBet = formatMiniBet(game.miniBet);
    if (miniBet) {
      const bet = document.createElement("span");
      bet.textContent = `Min bet ${miniBet}`;
      meta.append(bet);
    }

    const button = document.createElement("button");
    button.className = "play-button";
    button.type = "button";
    button.textContent = "Play Demo";
    button.disabled = !game.symbol;
    button.addEventListener("click", () => openGame(game));

    body.append(provider, title, meta, button);
    card.append(imageWrap, body);
    return card;
  };

  const renderGames = () => {
    if (!els.grid) return;

    els.grid.innerHTML = "";

    const visibleGames = filteredGames.slice(0, renderedCount);
    const fragment = document.createDocumentFragment();
    visibleGames.forEach((game) => fragment.append(createGameCard(game)));
    els.grid.append(fragment);

    if (!filteredGames.length) {
      setStatus("No Pragmatic Play games match your search.");
    } else {
      setStatus("");
    }

    if (els.loadMoreWrap && els.loadMore) {
      const hasMore = renderedCount < filteredGames.length;
      els.loadMoreWrap.hidden = !hasMore;
      els.loadMore.textContent = `Load more (${filteredGames.length - renderedCount} left)`;
    }

    setTotals();
  };

  const applySearch = () => {
    const query = (els.search?.value || "").trim().toLowerCase();
    filteredGames = query
      ? games.filter((game) => game.title.toLowerCase().includes(query))
      : games.slice();
    renderedCount = PAGE_SIZE;
    renderGames();
  };

  const setPlayerLoading = (isLoading) => {
    if (!els.frameLoader) return;
    els.frameLoader.hidden = !isLoading;
    els.frameLoader.classList.toggle("is-visible", isLoading);
  };

  const scrollToPlayer = () => {
    window.requestAnimationFrame(() => {
      const target = els.playerView?.querySelector(".player-shell") || els.playerView;
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 14;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  const openGame = (game) => {
    if (!game.symbol || !els.frame || !els.playerView || !els.catalogView) return;

    if (els.frameTitle) els.frameTitle.textContent = game.title;
    if (els.frameProvider) els.frameProvider.textContent = game.provider;
    setPlayerLoading(true);
    els.frame.src = buildDemoUrl(game.symbol);
    els.catalogView.hidden = true;
    els.playerView.hidden = false;
    els.body.classList.add("is-playing-demo");
    scrollToPlayer();
  };

  const closeGame = () => {
    if (!els.frame || !els.playerView || !els.catalogView) return;

    els.frame.src = "about:blank";
    els.playerView.hidden = true;
    els.catalogView.hidden = false;
    els.body.classList.remove("is-playing-demo");
    setPlayerLoading(false);
    window.scrollTo({ top: els.catalogView.offsetTop, behavior: "smooth" });
  };

  const loadGames = async () => {
    setStatus("Loading Pragmatic Play catalog...");

    try {
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      if (!Array.isArray(payload?.data)) throw new Error("Invalid JSON: data array is missing.");

      games = payload.data.map(normalizeGame).filter((game) => game.title && game.symbol);
      filteredGames = games.slice();
      renderedCount = PAGE_SIZE;
      renderGames();
    } catch (error) {
      console.error(error);
      games = [];
      filteredGames = [];
      renderGames();
      setStatus("Unable to load ./data/pragmatic-games.json. Check that the local server is running and the file exists.", true);
    }
  };

  els.search?.addEventListener("input", applySearch);
  els.loadMore?.addEventListener("click", () => {
    renderedCount += PAGE_SIZE;
    renderGames();
  });
  els.backToGames?.addEventListener("click", closeGame);
  els.frame?.addEventListener("load", () => setPlayerLoading(false));

  loadGames();
})();
