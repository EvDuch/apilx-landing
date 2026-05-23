(() => {
  "use strict";

  const THREE_SRC = "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js";
  const GSAP_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js";
  const SCROLL_TRIGGER_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js";

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const easeOut = (value) => 1 - Math.pow(1 - clamp(value), 3);
  const easeInOut = (value) => {
    const t = clamp(value);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const getTopResetZone = () => 12;

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });

  const loadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });

  const drawFallbackSymbol = (ctx, cx, cy, size) => {
    const gradient = ctx.createLinearGradient(cx, cy - size * 0.55, cx, cy + size * 0.55);
    gradient.addColorStop(0, "#78d9ff");
    gradient.addColorStop(0.46, "#b66be3");
    gradient.addColorStop(1, "#ff1591");

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(size / 400, size / 400);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, -150, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-128, 112, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(138, 112, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12, -98);
    ctx.bezierCurveTo(40, -60, 82, 24, 72, 78);
    ctx.bezierCurveTo(62, 134, 28, 96, 28, 44);
    ctx.bezierCurveTo(28, -8, -16, -54, -48, -70);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-82, 82);
    ctx.bezierCurveTo(-34, 82, -4, 58, 24, 24);
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.strokeStyle = gradient;
    ctx.stroke();
    ctx.restore();
  };

  const chipCtaFallbacks = {
    en: "Send request",
    ru: "Оставить заявку",
    es: "Enviar solicitud",
    pt: "Enviar pedido",
    br: "Enviar pedido",
    fr: "Envoyer la demande",
    de: "Anfrage senden",
    it: "Invia richiesta",
    tr: "Talep gönder",
    hi: "अनुरोध भेजें"
  };

  const getCurrentLanguage = () => document.documentElement.lang || localStorage.getItem("api-lx-language") || "en";

  const getChipCtaLabel = () => {
    const lang = getCurrentLanguage();
    const translations = window.API_LX_TRANSLATIONS || {};
    return translations[lang]?.lead_submit || translations.en?.lead_submit || chipCtaFallbacks[lang] || chipCtaFallbacks.en;
  };

  const makeChipTexture = (symbolImage = null) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    const cx = 512;
    const cy = 512;

    const bg = ctx.createRadialGradient(cx - 170, cy - 210, 30, cx, cy, 520);
    bg.addColorStop(0, "#f0ffff");
    bg.addColorStop(0.18, "#79f2ff");
    bg.addColorStop(0.48, "#2f7bff");
    bg.addColorStop(0.76, "#7137d8");
    bg.addColorStop(1, "#1b0a55");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, 500, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 72; i += 1) {
      const angle = (i / 72) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = i % 2 ? "rgba(18,16,95,.42)" : "rgba(130,245,255,.28)";
      ctx.fillRect(438, -8, 60, 16);
      ctx.fill();
      ctx.restore();
    }

    ctx.strokeStyle = "rgba(238,255,255,.88)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, 430, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(124,245,255,.92)";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 344, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(177,116,255,.78)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 256, 0, Math.PI * 2);
    ctx.stroke();

    const center = ctx.createRadialGradient(cx - 84, cy - 118, 20, cx, cy, 250);
    center.addColorStop(0, "#efffff");
    center.addColorStop(0.24, "#86f0ff");
    center.addColorStop(0.58, "#345ee8");
    center.addColorStop(1, "#201064");
    ctx.fillStyle = center;
    ctx.beginPath();
    ctx.arc(cx, cy, 226, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.shadowColor = "rgba(8, 7, 42, 0.48)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 12;
    if (symbolImage) {
      const symbolSize = 260;
      ctx.drawImage(symbolImage, -symbolSize / 2, -symbolSize / 2 - 6, symbolSize, symbolSize);
    } else {
      drawFallbackSymbol(ctx, 0, -6, 260);
    }
    ctx.fillStyle = "rgba(225,253,255,.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 76px Comfortaa, Noto Sans, sans-serif";
    ctx.fillText("API LX", 0, 245);
    ctx.restore();

    return canvas;
  };

  const setStaticCore = (hero, core, cards) => {
    document.body.classList.add("poker-transition-static");
    hero?.style.setProperty("--chip-hero-dim", "0");
    hero?.style.setProperty("--chip-hero-scale", "1");
    core?.style.setProperty("--chip-progress", "1");
    core?.style.setProperty("--chip-core-progress", "1");
    core?.style.setProperty("--chip-bridge-opacity", "0.88");
    core?.style.setProperty("--chip-bridge-y", "-24px");
    core?.style.setProperty("--chip-bridge-scale", "1.06");
    core?.style.setProperty("--chip-transition-scale", "1");
    core?.style.setProperty("--chip-transition-opacity", "0.82");
    cards.forEach((card) => {
      card.style.setProperty("--card-progress", "1");
      card.style.setProperty("--card-blur", "0px");
      card.style.setProperty("--card-x", "0px");
      card.style.setProperty("--card-y", "0px");
      card.style.setProperty("--card-z", "0px");
      card.style.setProperty("--card-rx", "0deg");
      card.style.setProperty("--card-ry", "0deg");
      card.style.setProperty("--card-scale", "1");
    });
  };

  const init = async () => {
    const hero = document.querySelector("#hero");
    const core = document.querySelector("[data-rtp-core]");
    const sceneEl = document.querySelector(".control-core-scene");
    const cards = Array.from(document.querySelectorAll(".control-core-grid .benefit-card"));
    if (!hero || !core || !sceneEl || !cards.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStaticCore(hero, core, cards);

    if (reduced) return;

    try {
      await loadScript(THREE_SRC);
      await loadScript(GSAP_SRC);
      await loadScript(SCROLL_TRIGGER_SRC);
    } catch (error) {
      console.warn("[api-lx-chip-transition] CDN unavailable, using static transition.", error);
      return;
    }

    const THREE = window.THREE;
    const gsap = window.gsap;
    if (!THREE || !gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(window.ScrollTrigger);
    document.body.classList.add("poker-transition-ready");

    const canvas = document.createElement("canvas");
    canvas.className = "poker-chip-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const symbolImage = await loadImage("assets/api-lx-symbol.webp").catch((error) => {
      console.warn("[api-lx-chip-transition] Symbol unavailable, using canvas fallback.", error);
      return null;
    });
    const chipTextureCanvas = makeChipTexture(symbolImage);
    const dockedChip = document.createElement("button");
    dockedChip.className = "poker-chip-action";
    dockedChip.type = "button";
    dockedChip.setAttribute("aria-label", "Оставить заявку на интеграцию");
    dockedChip.title = "Оставить заявку";
    dockedChip.innerHTML = `
      <span class="poker-chip-action__hint">Оставить заявку</span>
    `;
    dockedChip.addEventListener("click", () => {
      document.querySelector("[data-lead-open]")?.click();
    });
    document.body.appendChild(dockedChip);
    const chipHint = dockedChip.querySelector(".poker-chip-action__hint");
    const updateChipCtaLabel = () => {
      const label = getChipCtaLabel();
      if (chipHint) chipHint.textContent = label;
      dockedChip.setAttribute("aria-label", label);
      dockedChip.title = label;
    };
    updateChipCtaLabel();
    window.addEventListener("api-lx-language-change", updateChipCtaLabel);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio <= 1.5
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.z = 9;

    scene.add(new THREE.AmbientLight(0xffffff, 1.08));
    const cyanLight = new THREE.PointLight(0x86f7ff, 1.55, 18);
    cyanLight.position.set(2.6, 2.4, 4);
    scene.add(cyanLight);
    const magentaLight = new THREE.PointLight(0x8b5cff, 1.22, 18);
    magentaLight.position.set(-2.8, -1.8, 3.5);
    scene.add(magentaLight);

    const texture = new THREE.CanvasTexture(chipTextureCanvas);
    texture.anisotropy = 2;
    texture.encoding = THREE.sRGBEncoding;

    const chipMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false
    });
    const chip = new THREE.Sprite(chipMaterial);
    chip.center.set(0.5, 0.5);
    scene.add(chip);

    const trailPositions = new Float32Array(42 * 3);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    const trail = new THREE.Line(
      trailGeometry,
      new THREE.LineBasicMaterial({ color: 0x8b5cff, transparent: true, opacity: 0.48 })
    );
    scene.add(trail);

    const particleCount = window.innerWidth < 760 ? 42 : 96;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 11;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      particlePositions[i * 3 + 2] = -1 - Math.random() * 3;
    }
    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(particlePositions, 3)),
      new THREE.PointsMaterial({
        color: 0x70e6ff,
        size: window.innerWidth < 760 ? 0.025 : 0.018,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    scene.add(particles);

    let width = 1;
    let height = 1;
    let viewWidth = 1;
    let viewHeight = 1;
    let progress = 0;
    let targetProgress = 0;
    const trailHistory = Array.from({ length: 42 }, () => new THREE.Vector3());
    const clock = new THREE.Clock();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      viewWidth = viewHeight * camera.aspect;
      updateCards(progress);
    };

    const screenToWorld = (x, y) => new THREE.Vector3((x - 0.5) * viewWidth, (0.5 - y) * viewHeight, 0);
    const mix = (a, b, t) => a + (b - a) * t;

    const cubicPoint = (a, b, c, d, t) => {
      const inv = 1 - t;
      return new THREE.Vector3(
        inv ** 3 * a.x + 3 * inv ** 2 * t * b.x + 3 * inv * t ** 2 * c.x + t ** 3 * d.x,
        inv ** 3 * a.y + 3 * inv ** 2 * t * b.y + 3 * inv * t ** 2 * c.y + t ** 3 * d.y,
        inv ** 3 * a.z + 3 * inv ** 2 * t * b.z + 3 * inv * t ** 2 * c.z + t ** 3 * d.z
      );
    };

    const chipPoint = (p) => {
      const mobile = width < 760;
      const start = screenToWorld(mobile ? -0.2 : -0.16, mobile ? 0.64 : 0.6);
      const end = screenToWorld(mobile ? 0.82 : 0.9, mobile ? 0.16 : 0.14);
      const controlA = screenToWorld(mobile ? -0.03 : -0.04, mobile ? 0.34 : 0.3);
      const controlB = screenToWorld(mobile ? 0.56 : 0.62, mobile ? 0.04 : 0.02);
      const start3 = start.clone();
      const end3 = end.clone();
      const t = easeOut(p);
      start3.z = -16;
      controlA.z = -7.2;
      controlB.z = 1.0;
      end3.z = 0.55;
      const point = cubicPoint(start3, controlA, controlB, end3, t);
      point.y += Math.sin(t * Math.PI) * (mobile ? 0.22 : 0.34);
      point.z += Math.sin(t * Math.PI) * (mobile ? 0.24 : 0.34);
      return point;
    };

    const chipScale = (p) => {
      const mobile = width < 760;
      const peakAt = 0.58;
      const peak = mobile ? 1.08 : 1.38;
      const docked = mobile ? 0.42 : 0.48;
      if (p < peakAt) {
        return mix(0.035, peak, easeOut(p / peakAt));
      }
      return mix(peak, docked, easeOut((p - peakAt) / (1 - peakAt)));
    };

    const updateCards = (p) => {
      const sceneRect = sceneEl.getBoundingClientRect();
      const centerX = sceneRect.left + sceneRect.width / 2;
      const centerY = sceneRect.top + sceneRect.height / 2;
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const tilt = Number.parseFloat(card.style.getPropertyValue("--tilt")) || 0;
        const cardReveal = easeOut((p - 0.72 - index * 0.025) / 0.22);
        const orbitX = centerX - (rect.left + rect.width / 2);
        const orbitY = centerY - (rect.top + rect.height / 2);
        card.style.setProperty("--card-progress", cardReveal.toFixed(3));
        card.style.setProperty("--card-blur", "0px");
        card.style.setProperty("--card-x", `${(orbitX * (1 - cardReveal)).toFixed(2)}px`);
        card.style.setProperty("--card-y", `${(orbitY * (1 - cardReveal) + (1 - cardReveal) * 44).toFixed(2)}px`);
        card.style.setProperty("--card-z", `${((cardReveal - 1) * 260).toFixed(2)}px`);
        card.style.setProperty("--card-rx", `${((1 - cardReveal) * 34).toFixed(2)}deg`);
        card.style.setProperty("--card-ry", `${((1 - cardReveal) * tilt * 1.35).toFixed(2)}deg`);
        card.style.setProperty("--card-scale", (0.7 + cardReveal * 0.3).toFixed(3));
      });
    };

    const updateCss = (p) => {
      const heroDim = p < 0.25 ? p * 1.28 : 0.32 + Math.min((p - 0.25) * 0.14, 0.08);
      hero.style.setProperty("--chip-hero-dim", heroDim.toFixed(3));
      hero.style.setProperty("--chip-hero-scale", (1 + Math.min(p / 0.25, 1) * 0.07).toFixed(3));
      hero.style.setProperty("--chip-progress", p.toFixed(3));
      core.style.setProperty("--chip-progress", p.toFixed(3));
      core.style.setProperty("--chip-core-progress", easeOut((p - 0.54) / 0.28).toFixed(3));
      core.style.setProperty("--chip-bridge-opacity", (0.72 + p * 0.22).toFixed(3));
      core.style.setProperty("--chip-bridge-y", `${(-42 * p).toFixed(2)}px`);
      core.style.setProperty("--chip-bridge-scale", (1 + p * 0.08).toFixed(3));
      core.style.setProperty("--chip-transition-scale", (0.86 + p * 0.16).toFixed(3));
      core.style.setProperty("--chip-transition-opacity", (0.58 + p * 0.28).toFixed(3));
      core.style.setProperty("--core-bg-scale", (0.78 + easeOut((p - 0.5) / 0.38) * 0.2).toFixed(3));
      core.style.setProperty("--core-head-y", `${((1 - easeOut((p - 0.62) / 0.24)) * 34).toFixed(2)}px`);
      core.style.setProperty("--core-head-opacity", (0.35 + easeOut((p - 0.62) / 0.24) * 0.65).toFixed(3));
      core.style.setProperty("--core-orb-scale", (0.74 + easeOut((p - 0.52) / 0.25) * 0.26).toFixed(3));
      core.style.setProperty("--core-orb-opacity", (0.18 + easeOut((p - 0.46) / 0.28) * 0.82).toFixed(3));
      core.style.setProperty("--core-orb-rotate", `${(p * 42).toFixed(2)}deg`);
      core.style.setProperty("--core-ring-a", `${(p * 160).toFixed(2)}deg`);
      core.style.setProperty("--core-ring-b", `${(p * -210).toFixed(2)}deg`);
      core.style.setProperty("--core-ring-c", `${(p * 140).toFixed(2)}deg`);
      document.documentElement.style.setProperty("--chip-canvas-opacity", p > 0.006 ? "1" : "0");
      document.documentElement.style.setProperty("--chip-action-opacity", p >= 0.94 ? "1" : "0");
      document.documentElement.style.setProperty("--chip-action-pointer", p >= 0.94 ? "auto" : "none");
      updateCards(p);
    };

    const resetChipToStart = () => {
      targetProgress = 0;
      progress = 0;
      updateCss(0);
      canvas.style.opacity = "0";
      dockedChip.style.opacity = "0";
      dockedChip.style.pointerEvents = "none";
      chip.visible = false;
      trail.visible = false;
      particles.visible = false;
    };

    const syncChipVisibility = (p) => {
      const isVisible = p > 0.006;
      const isFlying = p > 0.006 && p < 0.94;
      const isDocked = targetProgress >= 0.975 && p >= 0.94;
      canvas.style.opacity = isVisible ? "1" : "0";
      dockedChip.style.opacity = isDocked ? "1" : "0";
      dockedChip.style.pointerEvents = isDocked ? "auto" : "none";
      chip.visible = isVisible;
      trail.visible = isFlying;
      particles.visible = isFlying;
    };

    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.04);
      if (targetProgress <= 0.002 || window.scrollY <= getTopResetZone()) {
        resetChipToStart();
      } else {
        progress += (targetProgress - progress) * 0.22;
      }
      const p = progress;
      const time = clock.elapsedTime;
      syncChipVisibility(p);
      const pos = chipPoint(p);
      chip.position.copy(pos);
      const scale = chipScale(p) * (1 + Math.sin(p * Math.PI * 10) * 0.045);
      const squash = 1 - Math.abs(Math.sin(p * Math.PI * 8)) * 0.18;
      chip.scale.set(scale * squash, scale, 1);
      chipMaterial.rotation = p * Math.PI * 8 + mix(-0.42, -0.16, easeInOut(p));

      particles.rotation.z += dt * 0.01;
      particles.position.y = Math.sin(time * 0.12) * 0.04;

      trailHistory.pop();
      trailHistory.unshift(pos.clone());
      trailHistory.forEach((point, index) => {
        trailPositions[index * 3] = point.x;
        trailPositions[index * 3 + 1] = point.y;
        trailPositions[index * 3 + 2] = point.z - index * 0.012;
      });
      trail.material.opacity = clamp((p - 0.14) / 0.2, 0, 0.22) * clamp((0.8 - p) / 0.2, 0, 1);
      trailGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };

    resize();
    updateCss(0);
    window.addEventListener("resize", resize, { passive: true });

    gsap.to({ p: 0 }, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        endTrigger: core,
        end: "65% center",
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (self.progress <= 0.002 || window.scrollY <= getTopResetZone()) {
            resetChipToStart();
            return;
          }
          const adjustedProgress = self.progress;
          targetProgress = adjustedProgress;
          updateCss(adjustedProgress);
        },
        onRefresh: (self) => {
          if (self.progress <= 0.002 || window.scrollY <= getTopResetZone()) {
            resetChipToStart();
            return;
          }
          const adjustedProgress = self.progress;
          targetProgress = adjustedProgress;
          progress = adjustedProgress;
          updateCss(adjustedProgress);
        }
      }
    });

    window.addEventListener("scroll", () => {
      if (window.scrollY <= getTopResetZone()) resetChipToStart();
    }, { passive: true });

    render();
    window.addEventListener("beforeunload", () => {
      texture.dispose();
      chipMaterial.dispose();
      trailGeometry.dispose();
      trail.material.dispose();
      particles.geometry.dispose();
      particles.material.dispose();
      renderer.dispose();
      dockedChip.remove();
    }, { once: true });
  };

  if (document.querySelector("[data-rtp-core]")) {
    init();
  } else {
    window.addEventListener("api-lx:partials-ready", init, { once: true });
  }
})();
