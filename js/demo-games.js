(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const launchConfig = {
    backendLaunchEndpoint: "http://127.0.0.1:8787/api/demo-launch",
    operatorId: "api-lx-demo",
    currency: "USD",
    language: "en",
    mode: "demo",
    rtpProfile: "demo-flex",
    mockLaunchBaseUrl: "https://example.com/demo-launch"
  };

  const games = [
    { id: "pragmatic-sweet-bonanza", title: "Sweet Bonanza", provider: "Pragmatic Play", providerCode: "pragmatic", rtp: "96.5%", isNew: true, theme: ["#ff4fc3", "#ffc96b"], launchPath: "sweet-bonanza" },
    { id: "pragmatic-gates-of-olympus", title: "Gates of Olympus", provider: "Pragmatic Play", providerCode: "pragmatic", rtp: "96.3%", isNew: true, theme: ["#9b58ff", "#2ed2ff"], launchPath: "gates-of-olympus" },
    { id: "pragmatic-sugar-rush", title: "Sugar Rush", provider: "Pragmatic Play", providerCode: "pragmatic", rtp: "96.5%", isNew: false, theme: ["#ff73d1", "#58ffb4"], launchPath: "sugar-rush" },
    { id: "pragmatic-big-bass-bonanza", title: "Big Bass Bonanza", provider: "Pragmatic Play", providerCode: "pragmatic", rtp: "96.7%", isNew: false, theme: ["#2ed2ff", "#0b3d91"], launchPath: "big-bass-bonanza" },
    { id: "pgsoft-mahjong-ways", title: "Mahjong Ways", provider: "PG Soft", providerCode: "pgsoft", rtp: "96.9%", isNew: true, theme: ["#ffc96b", "#ff4fc3"], launchPath: "mahjong-ways" },
    { id: "pgsoft-lucky-neko", title: "Lucky Neko", provider: "PG Soft", providerCode: "pgsoft", rtp: "96.7%", isNew: false, theme: ["#ff4fc3", "#9b58ff"], launchPath: "lucky-neko" },
    { id: "pgsoft-fortune-tiger", title: "Fortune Tiger", provider: "PG Soft", providerCode: "pgsoft", rtp: "96.8%", isNew: true, theme: ["#ff7a45", "#ffc96b"], launchPath: "fortune-tiger" },
    { id: "pgsoft-wild-bandito", title: "Wild Bandito", provider: "PG Soft", providerCode: "pgsoft", rtp: "96.7%", isNew: false, theme: ["#9b58ff", "#2ed2ff"], launchPath: "wild-bandito" },
    { id: "amusnet-book-of-dead", title: "Book of Dead", provider: "Amusnet", providerCode: "amusnet", rtp: "96.2%", isNew: false, theme: ["#ffc96b", "#6b3fdd"], launchPath: "book-of-dead" },
    { id: "amusnet-20-golden-coins", title: "20 Golden Coins", provider: "Amusnet", providerCode: "amusnet", rtp: "95.9%", isNew: true, theme: ["#ffd86e", "#ff4fc3"], launchPath: "20-golden-coins" },
    { id: "amusnet-wolf-gold", title: "Wolf Gold", provider: "Amusnet", providerCode: "amusnet", rtp: "96.0%", isNew: false, theme: ["#2ed2ff", "#1d164e"], launchPath: "wolf-gold" },
    { id: "evolution-lightning-roulette", title: "Lightning Roulette", provider: "Evolution", providerCode: "evolution", rtp: "97.3%", isNew: true, theme: ["#2ed2ff", "#9b58ff"], launchPath: "lightning-roulette" },
    { id: "evolution-crazy-time", title: "Crazy Time", provider: "Evolution", providerCode: "evolution", rtp: "96.1%", isNew: false, theme: ["#ff4fc3", "#2ed2ff"], launchPath: "crazy-time" },
    { id: "evolution-dream-catcher", title: "Dream Catcher", provider: "Evolution", providerCode: "evolution", rtp: "96.6%", isNew: false, theme: ["#58ffb4", "#9b58ff"], launchPath: "dream-catcher" }
  ];

  const grid = $("[data-game-grid]");
  const totalGames = $("[data-total-games]");
  const launcher = $("[data-launcher]");
  const frame = $("[data-launch-frame]");
  const launchTitle = $("[data-launch-title]");
  const closeLauncher = $("[data-close-launcher]");
  const canvas = $("[data-particles]");
  const ctx = canvas.getContext("2d");
  let activeProvider = "all";
  let particles = [];

  const gameIndex = new Map(games.map((game) => [game.id, game]));

  const generateGuestSessionId = () => {
    if (window.crypto?.randomUUID) {
      return `guest_${window.crypto.randomUUID()}`;
    }
    const random = Math.random().toString(36).slice(2, 10);
    return `guest_${Date.now().toString(36)}_${random}`;
  };

  const buildLaunchPayload = (game, guestSessionId) => ({
    operatorId: launchConfig.operatorId,
    gameId: game.id,
    gameName: game.title,
    provider: game.providerCode,
    mode: launchConfig.mode,
    currency: launchConfig.currency,
    language: launchConfig.language,
    rtpProfile: launchConfig.rtpProfile,
    guestSessionId,
    returnUrl: window.location.href,
    createdAt: new Date().toISOString()
  });

  const createMockLaunchUrl = (payload, game) => {
    const params = new URLSearchParams({
      gameId: payload.gameId,
      provider: payload.provider,
      sessionId: payload.guestSessionId,
      mode: payload.mode,
      currency: payload.currency,
      lang: payload.language
    });
    return `${launchConfig.mockLaunchBaseUrl}/${game.launchPath}?${params.toString()}`;
  };

  const DemoLaunchService = {
    async createLaunchSession(payload) {
      const response = await fetch(launchConfig.backendLaunchEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: payload.gameId,
          provider: payload.provider,
          currency: payload.currency,
          language: payload.language,
          guestSessionId: payload.guestSessionId
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Demo launch service is unavailable.");
      }
      if (!data.launch_url) {
        throw new Error("Demo launch service returned an invalid response.");
      }

      return {
        launchUrl: data.launch_url,
        guestSessionId: data.guestSessionId || payload.guestSessionId,
        expiresAt: data.expiresAt,
        provider: data.provider || payload.provider,
        gameId: data.gameId || payload.gameId
      };
    }
  };

  const imageForGame = (game) => {
    const initials = game.title.split(" ").map((word) => word[0]).slice(0, 2).join("");
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${game.theme[0]}"/>
            <stop offset="1" stop-color="${game.theme[1]}"/>
          </linearGradient>
          <radialGradient id="r" cx=".72" cy=".2" r=".75">
            <stop offset="0" stop-color="#fff" stop-opacity=".35"/>
            <stop offset=".45" stop-color="#fff" stop-opacity=".06"/>
            <stop offset="1" stop-color="#000" stop-opacity=".12"/>
          </radialGradient>
        </defs>
        <rect width="640" height="480" fill="url(#g)"/>
        <rect width="640" height="480" fill="url(#r)"/>
        <circle cx="116" cy="360" r="120" fill="#fff" opacity=".1"/>
        <circle cx="530" cy="92" r="84" fill="#fff" opacity=".15"/>
        <path d="M90 110 C180 32, 280 90, 360 58 S520 56, 574 170" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="18" stroke-linecap="round"/>
        <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Comfortaa,Noto Sans,Noto Sans Devanagari,Noto Sans Georgian,Noto Sans Thai,Noto Sans KR,Noto Sans SC,sans-serif" font-size="112" font-weight="900" fill="#fff" opacity=".95">${initials}</text>
        <text x="50%" y="67%" dominant-baseline="middle" text-anchor="middle" font-family="Comfortaa,Noto Sans,Noto Sans Devanagari,Noto Sans Georgian,Noto Sans Thai,Noto Sans KR,Noto Sans SC,sans-serif" font-size="30" font-weight="800" fill="#fff" opacity=".82">${game.provider}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const renderGames = () => {
    const visibleGames = activeProvider === "all" ? games : games.filter((game) => game.provider === activeProvider);
    grid.innerHTML = visibleGames.map((game) => `
      <article class="game-card" data-game-card>
        <div class="game-art">
          <img src="${imageForGame(game)}" alt="${game.title}" loading="lazy" width="640" height="480" />
          <div class="game-badges">
            <span class="badge">${game.rtp} RTP</span>
            ${game.isNew ? '<span class="badge new">NEW</span>' : '<span></span>'}
          </div>
        </div>
        <div class="game-body">
          <span class="provider">${game.provider}</span>
          <h3>${game.title}</h3>
          <button class="play-button" type="button" data-game-id="${game.id}">Play Demo</button>
        </div>
      </article>
    `).join("");

    $$("[data-game-card]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    });
  };

  const openLauncher = (url, title) => {
    launchTitle.textContent = title;
    frame.src = url;
    launcher.classList.add("open");
    launcher.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const openLaunchError = (gameTitle, message) => {
    launchTitle.textContent = `${gameTitle} Demo Unavailable`;
    frame.srcdoc = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: Comfortaa, 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Georgian', 'Noto Sans Thai', 'Noto Sans KR', 'Noto Sans SC', sans-serif;
              color: #fff;
              background: radial-gradient(circle at 50% 25%, rgba(255,79,195,.18), transparent 22rem), #080313;
            }
            .message {
              max-width: 560px;
              padding: 28px;
              text-align: center;
            }
            h1 { margin: 0 0 12px; font-size: clamp(28px, 6vw, 44px); }
            p { margin: 0; color: #d8d2eb; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="message">
            <h1>Demo launch unavailable</h1>
            <p>${message}</p>
          </div>
        </body>
      </html>
    `;
    launcher.classList.add("open");
    launcher.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLauncherModal = () => {
    launcher.classList.remove("open");
    launcher.setAttribute("aria-hidden", "true");
    frame.src = "about:blank";
    frame.removeAttribute("srcdoc");
    document.body.style.overflow = "";
  };

  const launchDemo = async (gameId) => {
    const game = gameIndex.get(gameId);
    if (!game) {
      throw new Error(`Unknown demo game: ${gameId}`);
    }

    const guestSessionId = generateGuestSessionId();
    const payload = buildLaunchPayload(game, guestSessionId);
    const session = await DemoLaunchService.createLaunchSession(payload);
    openLauncher(session.launchUrl, game.title);
    return session;
  };

  window.launchDemo = launchDemo;

  totalGames.textContent = games.length.toString();
  renderGames();

  $("[data-filters]").addEventListener("click", (event) => {
    const button = event.target.closest("[data-provider]");
    if (!button) return;
    activeProvider = button.dataset.provider;
    $$(".filter").forEach((filter) => filter.classList.toggle("active", filter === button));
    renderGames();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-game-id]");
    if (!button) return;
    launchDemo(button.dataset.gameId).catch((error) => {
      console.error(error);
      const game = gameIndex.get(button.dataset.gameId);
      openLaunchError(game?.title || "Game", "The local demo launch backend is not available. Start it with: node backend/server.js");
    });
  });

  closeLauncher.addEventListener("click", closeLauncherModal);
  launcher.addEventListener("click", (event) => {
    if (event.target === launcher) closeLauncherModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && launcher.classList.contains("open")) closeLauncherModal();
  });

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: prefersReducedMotion ? 16 : 46 }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 0.8
    }));
  };

  const drawParticles = () => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > rect.width) p.vx *= -1;
      if (p.y < 0 || p.y > rect.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.72 ? "rgba(255,201,107,.72)" : "rgba(46,210,255,.72)";
      ctx.fill();
    });
    if (!prefersReducedMotion) requestAnimationFrame(drawParticles);
  };

  resizeCanvas();
  drawParticles();
  window.addEventListener("resize", resizeCanvas);
})();
