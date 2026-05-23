(() => {
  "use strict";

  const shell = document.querySelector("[data-globe-shell]");
  const mount = document.querySelector("[data-globe]");
  const fallback = document.querySelector("[data-globe-fallback]");
  const loading = document.querySelector("[data-globe-loading]");
  const tooltip = document.querySelector("[data-map-tooltip]");
  const regionRows = Array.from(document.querySelectorAll("[data-region-country]"));

  if (!shell || !mount) return;

  const clientPoints = [
    { country: "Brazil", lat: -14.2350, lng: -51.9253, clients: 30 },
    { country: "India", lat: 20.5937, lng: 78.9629, clients: 42 },
    { country: "Turkey", lat: 38.9637, lng: 35.2433, clients: 21 },
    { country: "Mexico", lat: 23.6345, lng: -102.5528, clients: 18 },
    { country: "Indonesia", lat: -0.7893, lng: 113.9213, clients: 25 },
    { country: "Germany", lat: 51.1657, lng: 10.4515, clients: 34 },
    { country: "Spain", lat: 40.4637, lng: -3.7492, clients: 22 },
    { country: "France", lat: 46.2276, lng: 2.2137, clients: 30 },
    { country: "Italy", lat: 41.8719, lng: 12.5674, clients: 21 },
    { country: "United Kingdom", lat: 55.3781, lng: -3.4360, clients: 32 },
    { country: "South Africa", lat: -30.5595, lng: 22.9375, clients: 20 },
    { country: "United Arab Emirates", lat: 23.4241, lng: 53.8478, clients: 19 },
    { country: "Vietnam", lat: 14.0583, lng: 108.2772, clients: 23 },
    { country: "Thailand", lat: 15.8700, lng: 100.9925, clients: 26 },
    { country: "Argentina", lat: -38.4161, lng: -63.6167, clients: 18 },
    { country: "Colombia", lat: 4.5709, lng: -74.2973, clients: 24 },
    { country: "Nigeria", lat: 9.0820, lng: 8.6753, clients: 34 },
    { country: "Philippines", lat: 12.8797, lng: 121.7740, clients: 22 },
    { country: "Canada", lat: 56.1304, lng: -106.3468, clients: 27 },
    { country: "Australia", lat: -25.2744, lng: 133.7751, clients: 24 }
  ];

  const hub = { country: "API LX Hub", lat: 25.2048, lng: 55.2708 };
  const activeCountryNames = new Set(clientPoints.map((point) => point.country));
  const countryAliases = new Map([
    ["turkiye", "Turkey"],
    ["türkiye", "Turkey"],
    ["republic of turkey", "Turkey"],
    ["united arab emirates", "United Arab Emirates"],
    ["united kingdom", "United Kingdom"],
    ["england", "United Kingdom"],
    ["great britain", "United Kingdom"]
  ]);
  const globeScripts = [
    "node_modules/three/build/three.min.js",
    "node_modules/three-globe/dist/three-globe.min.js",
    "node_modules/topojson-client/dist/topojson-client.min.js"
  ];
  const worldAtlasUrl = "node_modules/world-atlas/countries-110m.json";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  let THREE;
  let renderer;
  let scene;
  let camera;
  let globe;
  let webglMarkers = [];
  let raycaster;
  let pointerNdc = { x: 0, y: 0 };
  let canvasRect = { left: 0, top: 0, width: 1, height: 1 };
  let activeCountry = "";
  let pointerPosition = null;
  let frameId = 0;
  let resizeObserver;
  let isDestroyed = false;
  let isDragging = false;
  let needsRaycast = false;
  let lastPointer = { x: 0, y: 0 };
  let pendingDrag = { x: 0, y: 0 };
  let dragVelocity = { x: 0, y: 0 };
  let pointerListeners = [];

  const translate = (key) => {
    const translations = window.API_LX_TRANSLATIONS || {};
    const lang = document.documentElement.lang || localStorage.getItem("api-lx-language") || "en";
    return translations[lang]?.[key] || translations.en?.[key] || key;
  };

  const countryKey = (country) => `country_${country.toLowerCase().replaceAll(" ", "_")}`;
  const normalizeCountryName = (name = "") => countryAliases.get(String(name).trim().toLowerCase()) || String(name).trim();
  const getPolygonCountry = (polygon) => normalizeCountryName(polygon?.properties?.ADMIN || polygon?.properties?.name || polygon?.properties?.NAME);
  const isActivePolygon = (polygon) => activeCountryNames.has(getPolygonCountry(polygon));
  const findClientPoint = (country) => clientPoints.find((point) => point.country === country);

  const hexToRgb = (hex) => {
    const value = hex.replace("#", "");
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  };

  const mixColor = (from, to, amount) => {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const t = Math.max(0, Math.min(1, amount));
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  };

  const rgb = (color) => `rgb(${color.r}, ${color.g}, ${color.b})`;

  const polygonCentroid = (polygon) => {
    const coordinates = polygon?.geometry?.coordinates;
    const ring = polygon?.geometry?.type === "MultiPolygon" ? coordinates?.[0]?.[0] : coordinates?.[0];
    if (!Array.isArray(ring) || !ring.length) return { lat: 0, lng: 0 };
    const total = ring.reduce((acc, pair) => ({ lng: acc.lng + pair[0], lat: acc.lat + pair[1] }), { lat: 0, lng: 0 });
    return { lat: total.lat / ring.length, lng: total.lng / ring.length };
  };

  const polygonGradientColor = (polygon) => {
    const { lat, lng } = polygonCentroid(polygon);
    const northSouth = (lat + 58) / 116;
    const eastWest = (lng + 180) / 360;
    const first = mixColor("#24e6ff", "#1768ff", northSouth);
    const second = mixColor("#1768ff", "#9b35ff", eastWest);
    return rgb({
      r: Math.round((first.r + second.r) / 2),
      g: Math.round((first.g + second.g) / 2),
      b: Math.round((first.b + second.b) / 2)
    });
  };

  const mutedLandColor = (polygon) => {
    const { lat, lng } = polygonCentroid(polygon);
    const base = mixColor("#031133", "#071c4d", Math.abs(lat) / 70);
    const violet = mixColor("#071c4d", "#170b3e", (lng + 180) / 360);
    return rgb({
      r: Math.round((base.r + violet.r) / 2),
      g: Math.round((base.g + violet.g) / 2),
      b: Math.round((base.b + violet.b) / 2)
    });
  };

  const hasWebGL = () => {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch (error) {
      return false;
    }
  };

  const shouldUseFallback = () => {
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
    const lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    return !hasWebGL() || (window.innerWidth < 380 && (lowMemory || lowCpu));
  };

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

  const fetchWorldPolygons = async () => {
    const response = await fetch(worldAtlasUrl, { cache: "force-cache" });
    if (!response.ok) throw new Error("Unable to load world polygons");
    const topology = await response.json();
    const geoJson = window.topojson?.feature(topology, topology.objects.countries);
    return Array.isArray(geoJson.features) ? geoJson.features : [];
  };

  const showFallback = () => {
    shell.dataset.globeMode = "fallback";
    shell.classList.add("ready", "fallback");
    if (loading) loading.hidden = true;
    if (fallback) fallback.hidden = false;
  };

  const hideTooltip = () => {
    if (tooltip) tooltip.style.display = "none";
  };

  const showTooltip = (point, event) => {
    if (!tooltip || !point) return;
    const position = event ? { x: event.clientX, y: event.clientY } : pointerPosition;
    tooltip.style.display = "block";
    tooltip.innerHTML = `<strong>${translate(countryKey(point.country))}</strong><span> &mdash; ${translate("map_tooltip_clients").replace("{count}", point.clients)}</span>`;
    if (position) {
      tooltip.style.left = `${position.x}px`;
      tooltip.style.top = `${position.y}px`;
    }
  };

  const setRegionHighlight = (country = "") => {
    regionRows.forEach((row) => {
      row.classList.toggle("active", row.dataset.regionCountry === country);
    });
    webglMarkers.forEach(({ point, sprite, baseScale }) => {
      const isActive = point.country === country;
      sprite.material.opacity = isActive ? 1 : 0.86;
      sprite.material.color.set(0xffffff);
      sprite.scale.setScalar(baseScale * (isActive ? 1.22 : 1));
    });
  };

  const refreshGlobeStyles = () => {
    if (!globe) return;
    globe
      .polygonAltitude((polygon) => {
        const country = getPolygonCountry(polygon);
        if (country === activeCountry) return 0.052;
        return activeCountryNames.has(country) ? 0.026 : 0.011;
      })
      .polygonCapColor((polygon) => {
        const country = getPolygonCountry(polygon);
        if (country === activeCountry) return "rgb(126, 245, 255)";
        if (activeCountryNames.has(country)) return polygonGradientColor(polygon);
        return mutedLandColor(polygon);
      })
      .polygonSideColor((polygon) => getPolygonCountry(polygon) === activeCountry ? "rgba(46, 210, 255, 0.54)" : "rgba(46, 210, 255, 0.16)")
      .polygonStrokeColor((polygon) => {
        const country = getPolygonCountry(polygon);
        if (country === activeCountry) return "rgba(255, 255, 255, 0.95)";
        return activeCountryNames.has(country) ? "rgba(46, 210, 255, 0.95)" : "rgba(80, 122, 190, 0.18)";
      })
      .pointColor((point) => point.country === activeCountry ? "rgba(255, 255, 255, 0.98)" : "rgba(46, 210, 255, 0.95)");
  };

  const setActiveCountry = (country = "", event) => {
    const point = findClientPoint(country);
    if (activeCountry === country) {
      if (point) showTooltip(point, event);
      return;
    }
    activeCountry = country;
    setRegionHighlight(country);
    refreshGlobeStyles();
    if (point) showTooltip(point, event);
  };

  const clearActiveCountry = () => {
    if (!activeCountry) {
      hideTooltip();
      return;
    }
    activeCountry = "";
    setRegionHighlight("");
    refreshGlobeStyles();
    hideTooltip();
  };

  const createMarkerTexture = () => {
    const texture = new THREE.TextureLoader().load("assets/api-lx-marker-logo.png");
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  };

  const createWebglMarkers = () => {
    const markerTexture = createMarkerTexture();
    webglMarkers = clientPoints.map((point, index) => {
      const material = new THREE.SpriteMaterial({
        map: markerTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.94,
        depthTest: false,
        depthWrite: false,
        sizeAttenuation: true
      });
      const sprite = new THREE.Sprite(material);
      const coords = typeof globe.getCoords === "function"
        ? globe.getCoords(point.lat, point.lng, 0.24)
        : { x: 0, y: 0, z: 0 };
      sprite.position.set(coords.x, coords.y, coords.z);
      sprite.renderOrder = 8;
      sprite.scale.setScalar(7 + Math.min(point.clients, 24) * 0.13);
      sprite.userData.point = point;
      sprite.userData.phase = index * 0.63;
      globe.add(sprite);
      return { point, sprite, baseScale: sprite.scale.x };
    });
  };

  const updateWebglMarkers = (time) => {
    const worldPosition = new THREE.Vector3();
    webglMarkers.forEach(({ sprite, baseScale }) => {
      sprite.getWorldPosition(worldPosition);
      const pulse = 1 + Math.sin(time * 0.0032 + sprite.userData.phase) * 0.075;
      sprite.visible = worldPosition.z > 8;
      if (sprite.visible && sprite.userData.point.country !== activeCountry) {
        sprite.scale.setScalar(baseScale * pulse);
      }
    });
  };

  const updatePointerNdc = (event) => {
    pointerNdc = {
      x: ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
      y: -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1
    };
    pointerPosition = { x: event.clientX, y: event.clientY };
    needsRaycast = true;
  };

  const raycastMarkers = () => {
    if (!needsRaycast || !raycaster || isDragging) return;
    needsRaycast = false;
    raycaster.setFromCamera(pointerNdc, camera);
    const sprites = webglMarkers.map(({ sprite }) => sprite).filter((sprite) => sprite.visible);
    const hit = raycaster.intersectObjects(sprites, false)[0]?.object;
    if (hit?.userData?.point) {
      setActiveCountry(hit.userData.point.country);
    } else if (activeCountry && !regionRows.some((row) => row.matches(":hover"))) {
      clearActiveCountry();
    }
  };

  const setupRegionRows = () => {
    regionRows.forEach((row) => {
      const country = row.dataset.regionCountry;
      row.addEventListener("pointerenter", (event) => setActiveCountry(country, event));
      row.addEventListener("pointermove", (event) => {
        const point = findClientPoint(country);
        if (point) showTooltip(point, event);
      });
      row.addEventListener("pointerleave", clearActiveCountry);
    });
  };

  const resize = () => {
    if (!renderer || !camera) return;
    const { width, height } = mount.getBoundingClientRect();
    const stageRect = shell.getBoundingClientRect();
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const renderScale = Math.max(1, safeHeight / Math.max(1, stageRect.height));
    renderer.setSize(safeWidth, safeHeight, false);
    camera.aspect = safeWidth / safeHeight;
    camera.position.z = (stageRect.width < 460 ? 350 : 330) * renderScale;
    camera.updateProjectionMatrix();
    canvasRect = renderer.domElement.getBoundingClientRect();
  };

  const setupDragRotation = () => {
    const onPointerMove = (event) => {
      const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
      const latest = events[events.length - 1] || event;
      if (!isDragging || !globe) {
        updatePointerNdc(latest);
        return;
      }
      const dx = latest.clientX - lastPointer.x;
      const dy = latest.clientY - lastPointer.y;
      pendingDrag.x += dx;
      pendingDrag.y += dy;
      dragVelocity.x = dx * 0.00038;
      dragVelocity.y = dy * 0.00018;
      lastPointer = { x: latest.clientX, y: latest.clientY, id: lastPointer.id };
    };

    const onPointerUp = () => {
      isDragging = false;
      shell.releasePointerCapture?.(lastPointer.id);
    };

    const onPointerDown = (event) => {
      isDragging = true;
      needsRaycast = false;
      pendingDrag = { x: 0, y: 0 };
      clearActiveCountry();
      canvasRect = renderer.domElement.getBoundingClientRect();
      lastPointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
      shell.setPointerCapture?.(event.pointerId);
    };

    const onPointerLeave = () => {
      if (!isDragging) clearActiveCountry();
    };

    shell.addEventListener("pointerdown", onPointerDown, { passive: true });
    shell.addEventListener("pointermove", onPointerMove, { passive: true });
    shell.addEventListener("pointerup", onPointerUp, { passive: true });
    shell.addEventListener("pointercancel", onPointerUp, { passive: true });
    shell.addEventListener("pointerleave", onPointerLeave, { passive: true });
    pointerListeners = [
      ["pointerdown", onPointerDown],
      ["pointermove", onPointerMove],
      ["pointerup", onPointerUp],
      ["pointercancel", onPointerUp],
      ["pointerleave", onPointerLeave]
    ];
  };

  const disposeObject = (object) => {
    object?.traverse?.((child) => {
      child.geometry?.dispose?.();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.filter(Boolean).forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value && typeof value.dispose === "function") value.dispose();
        });
        material.dispose?.();
      });
    });
  };

  const cleanup = () => {
    isDestroyed = true;
    cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
    pointerListeners.forEach(([eventName, handler]) => shell.removeEventListener(eventName, handler));
    window.removeEventListener("beforeunload", cleanup);
    hideTooltip();
    disposeObject(scene);
    renderer?.dispose?.();
    renderer?.forceContextLoss?.();
    webglMarkers = [];
    mount.replaceChildren();
  };

  const initGlobe = async () => {
    setupRegionRows();
    if (shouldUseFallback()) {
      showFallback();
      return;
    }

    try {
      for (const src of globeScripts) {
        await loadScript(src);
      }
    } catch (error) {
      console.warn("[api-lx-globe] Local globe libraries unavailable, using fallback globe.", error);
      showFallback();
      return;
    }

    THREE = window.THREE;
    const ThreeGlobe = window.ThreeGlobe;
    if (!THREE || !ThreeGlobe || isDestroyed) {
      showFallback();
      return;
    }

    let polygons = [];
    try {
      polygons = await fetchWorldPolygons();
    } catch (error) {
      console.warn("[api-lx-globe] World polygons unavailable, rendering points only.", error);
    }
    shell.dataset.globePolygons = String(polygons.length);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 1, 1200);
    camera.position.set(0, 0, 330);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isCoarsePointer && (window.devicePixelRatio || 1) <= 1.5,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.2 : 1.5));
    mount.appendChild(renderer.domElement);
    shell.dataset.globeMode = "webgl";

    const arcs = clientPoints.map((point, index) => ({
      startLat: hub.lat,
      startLng: hub.lng,
      endLat: point.lat,
      endLng: point.lng,
      color: index % 2
        ? ["rgba(46,210,255,0.1)", "rgba(255,79,195,0.78)"]
        : ["rgba(46,210,255,0.16)", "rgba(126,245,255,0.92)"]
    }));
    const ringPoints = clientPoints.filter((_, index) => index % 2 === 0);

    globe = new ThreeGlobe()
      .showAtmosphere(true)
      .atmosphereColor("#2ed2ff")
      .atmosphereAltitude(0.21)
      .polygonsData(polygons)
      .polygonCapColor((polygon) => isActivePolygon(polygon) ? polygonGradientColor(polygon) : mutedLandColor(polygon))
      .polygonSideColor((polygon) => isActivePolygon(polygon) ? "rgb(24, 112, 190)" : "rgb(13, 37, 88)")
      .polygonStrokeColor((polygon) => isActivePolygon(polygon) ? "rgba(46, 210, 255, 0.95)" : "rgba(80, 122, 190, 0.18)")
      .polygonAltitude(0.014)
      .polygonsTransitionDuration(180)
      .pointsData(clientPoints)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude(0.066)
      .pointRadius((point) => 0.42 + point.clients / 150)
      .pointResolution(8)
      .pointColor(() => "rgba(46, 210, 255, 0.95)")
      .ringsData(ringPoints)
      .ringLat("lat")
      .ringLng("lng")
      .ringColor(() => (time) => `rgba(46, 210, 255, ${Math.max(0, 0.44 - time * 0.42)})`)
      .ringMaxRadius(5.6)
      .ringPropagationSpeed(1.25)
      .ringRepeatPeriod(1900)
      .arcsData(arcs)
      .arcStartLat("startLat")
      .arcStartLng("startLng")
      .arcEndLat("endLat")
      .arcEndLng("endLng")
      .arcColor("color")
      .arcAltitude(0.22)
      .arcStroke(0.62)
      .arcDashLength(0.72)
      .arcDashGap(2.1)
      .arcDashInitialGap(() => Math.random())
      .arcDashAnimateTime(4200);

    if (typeof globe.globeCurvatureResolution === "function") globe.globeCurvatureResolution(7);
    if (typeof globe.polygonCapCurvatureResolution === "function") globe.polygonCapCurvatureResolution(8);
    if (typeof globe.arcCurveResolution === "function") globe.arcCurveResolution(24);
    if (typeof globe.arcCircularResolution === "function") globe.arcCircularResolution(4);
    if (typeof globe.ringResolution === "function") globe.ringResolution(24);
    if (typeof globe.showGraticules === "function") globe.showGraticules(false);

    const globeMaterial = globe.globeMaterial();
    globeMaterial.color = new THREE.Color(0x03194f);
    globeMaterial.emissive = new THREE.Color(0x0a2d8f);
    globeMaterial.emissiveIntensity = 0.92;
    globeMaterial.transparent = true;
    globeMaterial.opacity = 0.18;
    globeMaterial.depthWrite = false;
    globeMaterial.shininess = 1.15;

    globe.rotation.y = -0.74;
    globe.rotation.x = -0.08;
    scene.add(globe);

    raycaster = new THREE.Raycaster();
    raycaster.params.Sprite = { threshold: 0.08 };
    createWebglMarkers();
    refreshGlobeStyles();

    scene.add(new THREE.AmbientLight(0x8ef4ff, 1.1));
    const keyLight = new THREE.DirectionalLight(0x9ef6ff, 1.75);
    keyLight.position.set(-130, 92, 190);
    scene.add(keyLight);
    const violetLight = new THREE.PointLight(0x8f56ff, 1.2, 520);
    violetLight.position.set(180, -70, 180);
    scene.add(violetLight);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();
    setupDragRotation();

    shell.classList.add("ready");
    if (loading) loading.hidden = true;
    if (fallback) fallback.hidden = true;
    window.addEventListener("beforeunload", cleanup);

    const animate = () => {
      if (isDestroyed) return;
      if (!prefersReducedMotion) {
        if (pendingDrag.x || pendingDrag.y) {
          globe.rotation.y += pendingDrag.x * 0.006;
          globe.rotation.x = Math.max(-0.7, Math.min(0.7, globe.rotation.x + pendingDrag.y * 0.003));
          pendingDrag = { x: 0, y: 0 };
        }
        globe.rotation.y += window.innerWidth < 768 ? 0.00072 : 0.00105;
        if (!isDragging) {
          globe.rotation.y += dragVelocity.x;
          globe.rotation.x = Math.max(-0.7, Math.min(0.7, globe.rotation.x + dragVelocity.y));
          dragVelocity.x *= 0.94;
          dragVelocity.y *= 0.92;
        }
      }
      updateWebglMarkers(performance.now());
      raycastMarkers();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();
  };

  initGlobe();
  window.API_LX_DESTROY_GLOBE = cleanup;
})();
