(() => {
  "use strict";

  const shell = document.querySelector("[data-globe-shell]");
  const mount = document.querySelector("[data-globe]");
  const fallback = document.querySelector("[data-globe-fallback]");
  const loading = document.querySelector("[data-globe-loading]");
  const tooltip = document.querySelector("[data-map-tooltip]");
  const regionList = document.querySelector("[data-region-list]");
  let regionRows = [];

  if (!shell || !mount) return;

  const GLOBE_ASSET_VERSION = "20260624-antarctica-coming-soon";
  const pendingScriptLoads = new Map();

  const versionedAssetUrl = (url) => {
    try {
      const parsed = new URL(url, window.location.href);
      parsed.searchParams.set("apilxv", GLOBE_ASSET_VERSION);
      return parsed.href;
    } catch {
      const separator = String(url).includes("?") ? "&" : "?";
      return `${url}${separator}apilxv=${encodeURIComponent(GLOBE_ASSET_VERSION)}`;
    }
  };

  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
  const nextFrame = () => new Promise((resolve) => window.requestAnimationFrame(resolve));

  const retry = async (task, attempts = 2, delay = 320) => {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await task(attempt);
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) await wait(delay);
      }
    }
    throw lastError;
  };

  const clientPoints = [
    { iso: "AL", country: "Albania", lat: 41.1533, lng: 20.1683, clients: 12 },
    { iso: "DZ", country: "Algeria", lat: 28.0339, lng: 1.6596, clients: 18 },
    { iso: "AO", country: "Angola", lat: -11.2027, lng: 17.8739, clients: 14 },
    { iso: "AR", country: "Argentina", lat: -38.4161, lng: -63.6167, clients: 22 },
    { iso: "AU", country: "Australia", lat: -25.2744, lng: 133.7751, clients: 28 },
    { iso: "AQ", country: "Antarctica", lat: -82.8628, lng: 135.0000, clients: 0, clientLabelKey: "map_coming_soon", fixedDotScale: 1.15 },
    { iso: "AT", country: "Austria", lat: 47.5162, lng: 14.5501, clients: 16 },
    { iso: "AZ", country: "Azerbaijan", lat: 40.1431, lng: 47.5769, clients: 17 },
    { iso: "BS", country: "Bahamas", lat: 25.0343, lng: -77.3963, clients: 9 },
    { iso: "BD", country: "Bangladesh", lat: 23.6850, lng: 90.3563, clients: 21 },
    { iso: "BY", country: "Belarus", lat: 53.7098, lng: 27.9534, clients: 13 },
    { iso: "BE", country: "Belgium", lat: 50.5039, lng: 4.4699, clients: 18 },
    { iso: "BG", country: "Bulgaria", lat: 42.7339, lng: 25.4858, clients: 19 },
    { iso: "BO", country: "Bolivia", lat: -16.2902, lng: -63.5887, clients: 11 },
    { iso: "BA", country: "Bosnia and Herzegovina", lat: 43.9159, lng: 17.6791, clients: 12 },
    { iso: "BW", country: "Botswana", lat: -22.3285, lng: 24.6849, clients: 10 },
    { iso: "BR", country: "Brazil", lat: -14.2350, lng: -51.9253, clients: 42 },
    { iso: "GB", country: "United Kingdom", lat: 55.3781, lng: -3.4360, clients: 36 },
    { iso: "HU", country: "Hungary", lat: 47.1625, lng: 19.5033, clients: 17 },
    { iso: "VN", country: "Vietnam", lat: 14.0583, lng: 108.2772, clients: 27 },
    { iso: "GH", country: "Ghana", lat: 7.9465, lng: -1.0232, clients: 19 },
    { iso: "GT", country: "Guatemala", lat: 15.7835, lng: -90.2308, clients: 10 },
    { iso: "DE", country: "Germany", lat: 51.1657, lng: 10.4515, clients: 38 },
    { iso: "HK", country: "Hong Kong", lat: 22.3193, lng: 114.1694, clients: 18 },
    { iso: "GR", country: "Greece", lat: 39.0742, lng: 21.8243, clients: 16 },
    { iso: "GE", country: "Georgia", lat: 42.3154, lng: 43.3569, clients: 14 },
    { iso: "GN", country: "Guinea", lat: 9.9456, lng: -9.6966, clients: 8 },
    { iso: "DK", country: "Denmark", lat: 56.2639, lng: 9.5018, clients: 15 },
    { iso: "EG", country: "Egypt", lat: 26.8206, lng: 30.8025, clients: 25 },
    { iso: "ZM", country: "Zambia", lat: -13.1339, lng: 27.8493, clients: 12 },
    { iso: "ZW", country: "Zimbabwe", lat: -19.0154, lng: 29.1549, clients: 11 },
    { iso: "IL", country: "Israel", lat: 31.0461, lng: 34.8516, clients: 20 },
    { iso: "IN", country: "India", lat: 20.5937, lng: 78.9629, clients: 46 },
    { iso: "ID", country: "Indonesia", lat: -0.7893, lng: 113.9213, clients: 31 },
    { iso: "JO", country: "Jordan", lat: 30.5852, lng: 36.2384, clients: 13 },
    { iso: "IQ", country: "Iraq", lat: 33.2232, lng: 43.6793, clients: 12 },
    { iso: "IR", country: "Iran", lat: 32.4279, lng: 53.6880, clients: 16 },
    { iso: "IE", country: "Ireland", lat: 53.4129, lng: -8.2439, clients: 15 },
    { iso: "IS", country: "Iceland", lat: 64.9631, lng: -19.0208, clients: 7 },
    { iso: "ES", country: "Spain", lat: 40.4637, lng: -3.7492, clients: 29 },
    { iso: "IT", country: "Italy", lat: 41.8719, lng: 12.5674, clients: 28 },
    { iso: "KZ", country: "Kazakhstan", lat: 48.0196, lng: 66.9237, clients: 18 },
    { iso: "CA", country: "Canada", lat: 56.1304, lng: -106.3468, clients: 30 },
    { iso: "KE", country: "Kenya", lat: -0.0236, lng: 37.9062, clients: 21 },
    { iso: "CN", country: "China", lat: 35.8617, lng: 104.1954, clients: 32 },
    { iso: "CO", country: "Colombia", lat: 4.5709, lng: -74.2973, clients: 27 },
    { iso: "CR", country: "Costa Rica", lat: 9.7489, lng: -83.7534, clients: 12 },
    { iso: "KG", country: "Kyrgyzstan", lat: 41.2044, lng: 74.7661, clients: 10 },
    { iso: "KR", country: "South Korea", lat: 35.9078, lng: 127.7669, clients: 24 },
    { iso: "KW", country: "Kuwait", lat: 29.3117, lng: 47.4818, clients: 12 },
    { iso: "LB", country: "Lebanon", lat: 33.8547, lng: 35.8623, clients: 11 },
    { iso: "LY", country: "Libya", lat: 26.3351, lng: 17.2283, clients: 9 },
    { iso: "LU", country: "Luxembourg", lat: 49.8153, lng: 6.1296, clients: 8 },
    { iso: "MY", country: "Malaysia", lat: 4.2105, lng: 101.9758, clients: 25 },
    { iso: "MA", country: "Morocco", lat: 31.7917, lng: -7.0926, clients: 20 },
    { iso: "MX", country: "Mexico", lat: 23.6345, lng: -102.5528, clients: 26 },
    { iso: "MN", country: "Mongolia", lat: 46.8625, lng: 103.8467, clients: 9 },
    { iso: "MZ", country: "Mozambique", lat: -18.6657, lng: 35.5296, clients: 13 },
    { iso: "MM", country: "Myanmar", lat: 21.9162, lng: 95.9560, clients: 14 },
    { iso: "NA", country: "Namibia", lat: -22.9576, lng: 18.4904, clients: 9 },
    { iso: "NG", country: "Nigeria", lat: 9.0820, lng: 8.6753, clients: 39 },
    { iso: "NL", country: "Netherlands", lat: 52.1326, lng: 5.2913, clients: 24 },
    { iso: "NZ", country: "New Zealand", lat: -40.9006, lng: 174.8860, clients: 14 },
    { iso: "NO", country: "Norway", lat: 60.4720, lng: 8.4689, clients: 13 },
    { iso: "NP", country: "Nepal", lat: 28.3949, lng: 84.1240, clients: 11 },
    { iso: "AE", country: "United Arab Emirates", lat: 23.4241, lng: 53.8478, clients: 23 },
    { iso: "PK", country: "Pakistan", lat: 30.3753, lng: 69.3451, clients: 24 },
    { iso: "PY", country: "Paraguay", lat: -23.4425, lng: -58.4438, clients: 10 },
    { iso: "PE", country: "Peru", lat: -9.1900, lng: -75.0152, clients: 17 },
    { iso: "PL", country: "Poland", lat: 51.9194, lng: 19.1451, clients: 22 },
    { iso: "PT", country: "Portugal", lat: 39.3999, lng: -8.2245, clients: 16 },
    { iso: "RS", country: "Serbia", lat: 44.0165, lng: 21.0059, clients: 15 },
    { iso: "RO", country: "Romania", lat: 45.9432, lng: 24.9668, clients: 19 },
    { iso: "RW", country: "Rwanda", lat: -1.9403, lng: 29.8739, clients: 10 },
    { iso: "SD", country: "Sudan", lat: 12.8628, lng: 30.2176, clients: 10 },
    { iso: "SS", country: "South Sudan", lat: 6.8770, lng: 31.3070, clients: 7 },
    { iso: "SG", country: "Singapore", lat: 1.3521, lng: 103.8198, clients: 22 },
    { iso: "SK", country: "Slovakia", lat: 48.6690, lng: 19.6990, clients: 12 },
    { iso: "SI", country: "Slovenia", lat: 46.1512, lng: 14.9955, clients: 11 },
    { iso: "SZ", country: "Eswatini", lat: -26.5225, lng: 31.4659, clients: 7 },
    { iso: "SY", country: "Syria", lat: 34.8021, lng: 38.9968, clients: 8 },
    { iso: "TH", country: "Thailand", lat: 15.8700, lng: 100.9925, clients: 30 },
    { iso: "TZ", country: "Tanzania", lat: -6.3690, lng: 34.8888, clients: 17 },
    { iso: "TN", country: "Tunisia", lat: 33.8869, lng: 9.5375, clients: 13 },
    { iso: "TM", country: "Turkmenistan", lat: 38.9697, lng: 59.5563, clients: 8 },
    { iso: "TR", country: "Turkey", lat: 38.9637, lng: 35.2433, clients: 28 },
    { iso: "UG", country: "Uganda", lat: 1.3733, lng: 32.2903, clients: 15 },
    { iso: "UZ", country: "Uzbekistan", lat: 41.3775, lng: 64.5853, clients: 14 },
    { iso: "UA", country: "Ukraine", lat: 48.3794, lng: 31.1656, clients: 21 },
    { iso: "UY", country: "Uruguay", lat: -32.5228, lng: -55.7658, clients: 11 },
    { iso: "PH", country: "Philippines", lat: 12.8797, lng: 121.7740, clients: 27 },
    { iso: "FI", country: "Finland", lat: 61.9241, lng: 25.7482, clients: 14 },
    { iso: "FR", country: "France", lat: 46.2276, lng: 2.2137, clients: 34 },
    { iso: "HR", country: "Croatia", lat: 45.1000, lng: 15.2000, clients: 13 },
    { iso: "CZ", country: "Czechia", lat: 49.8175, lng: 15.4730, clients: 16 },
    { iso: "CL", country: "Chile", lat: -35.6751, lng: -71.5430, clients: 16 },
    { iso: "CH", country: "Switzerland", lat: 46.8182, lng: 8.2275, clients: 18 },
    { iso: "SE", country: "Sweden", lat: 60.1282, lng: 18.6435, clients: 17 },
    { iso: "CM", country: "Cameroon", lat: 7.3697, lng: 12.3547, clients: 14 },
    { iso: "CF", country: "Central African Republic", lat: 6.6111, lng: 20.9394, clients: 6 },
    { iso: "TD", country: "Chad", lat: 15.4542, lng: 18.7322, clients: 8 },
    { iso: "CG", country: "Republic of the Congo", lat: -0.2280, lng: 15.8277, clients: 7 },
    { iso: "GQ", country: "Equatorial Guinea", lat: 1.6508, lng: 10.2679, clients: 6 },
    { iso: "GA", country: "Gabon", lat: -0.8037, lng: 11.6094, clients: 7 },
    { iso: "BJ", country: "Benin", lat: 9.3077, lng: 2.3158, clients: 8 },
    { iso: "BF", country: "Burkina Faso", lat: 12.2383, lng: -1.5616, clients: 7 },
    { iso: "CI", country: "Ivory Coast", lat: 7.5400, lng: -5.5471, clients: 13 },
    { iso: "GW", country: "Guinea-Bissau", lat: 11.8037, lng: -15.1804, clients: 5 },
    { iso: "ML", country: "Mali", lat: 17.5707, lng: -3.9962, clients: 8 },
    { iso: "NE", country: "Niger", lat: 17.6078, lng: 8.0817, clients: 7 },
    { iso: "SN", country: "Senegal", lat: 14.4974, lng: -14.4524, clients: 11 },
    { iso: "TG", country: "Togo", lat: 8.6195, lng: 0.8248, clients: 7 },
    { iso: "ZA", country: "South Africa", lat: -30.5595, lng: 22.9375, clients: 24 },
    { iso: "JM", country: "Jamaica", lat: 18.1096, lng: -77.2975, clients: 9 },
    { iso: "JP", country: "Japan", lat: 36.2048, lng: 138.2529, clients: 25 }
  ];

  const hub = { country: "API LX Hub", lat: 25.2048, lng: 55.2708 };
  const activeCountryNames = new Set(clientPoints.map((point) => point.country));
  const countryAliases = new Map([
    ["bosnia and herz.", "Bosnia and Herzegovina"],
    ["bosnia and herzegovina", "Bosnia and Herzegovina"],
    ["central african rep.", "Central African Republic"],
    ["central african republic", "Central African Republic"],
    ["czech republic", "Czechia"],
    ["czechia", "Czechia"],
    ["côte d'ivoire", "Ivory Coast"],
    ["cote d'ivoire", "Ivory Coast"],
    ["ivory coast", "Ivory Coast"],
    ["eq. guinea", "Equatorial Guinea"],
    ["equatorial guinea", "Equatorial Guinea"],
    ["eswatini", "Eswatini"],
    ["swaziland", "Eswatini"],
    ["republic of serbia", "Serbia"],
    ["serbia", "Serbia"],
    ["s. sudan", "South Sudan"],
    ["south sudan", "South Sudan"],
    ["sudan", "Sudan"],
    ["republic of the congo", "Republic of the Congo"],
    ["congo", "Republic of the Congo"],
    ["turkiye", "Turkey"],
    ["türkiye", "Turkey"],
    ["republic of turkey", "Turkey"],
    ["united arab emirates", "United Arab Emirates"],
    ["united kingdom", "United Kingdom"],
    ["england", "United Kingdom"],
    ["great britain", "United Kingdom"],
    ["antarctica", "Antarctica"]
  ]);
  const globeLibraries = [
    {
      name: "three",
      globalName: "THREE",
      urls: [
        "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js",
        "https://unpkg.com/three@0.149.0/build/three.min.js"
      ]
    },
    {
      name: "three-globe",
      globalName: "ThreeGlobe",
      urls: [
        "https://cdn.jsdelivr.net/npm/three-globe@2.30.0/dist/three-globe.min.js",
        "https://unpkg.com/three-globe@2.30.0/dist/three-globe.min.js"
      ]
    },
    {
      name: "topojson-client",
      globalName: "topojson",
      urls: [
        "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js",
        "https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js"
      ]
    }
  ];

  const worldAtlasUrls = [
    "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json",
    "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"
  ];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const prefersSlowUpdate = window.matchMedia("(update: slow)").matches;
  const MARKER_ALTITUDE = 0.029;
  const isLowPowerDevice = () => prefersSlowUpdate
    || isCoarsePointer
    || (navigator.deviceMemory && navigator.deviceMemory <= 4)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  let THREE;
  let renderer;
  let scene;
  let camera;
  let globe;
  let webglMarkers = [];
  let pokerChipTexture = null;
  let neonDotTexture = null;
  let raycaster;
  let pointerNdc = { x: 0, y: 0 };
  let canvasRect = { left: 0, top: 0, width: 1, height: 1 };
  let activeCountry = "";
  let pointerPosition = null;
  let frameId = 0;
  let resizeObserver;
  let visibilityObserver;
  let isGlobeInView = true;
  let isDocumentVisible = !document.hidden;
  let onDocumentVisibilityChange = null;
  let isDestroyed = false;
  let isDragging = false;
  let needsRaycast = false;
  let lastPointer = { x: 0, y: 0 };
  let pendingDrag = { x: 0, y: 0 };
  let dragVelocity = { x: 0, y: 0 };
  let pointerListeners = [];
  let resizeFrame = 0;
  let wakeupTimers = [];
  let wakeListeners = [];
  let animationWatchdog = 0;
  let lastAnimatedAt = 0;

  const translate = (key) => {
    const translations = window.API_LX_TRANSLATIONS || {};
    const lang = document.documentElement.lang || localStorage.getItem("api-lx-language") || "en";
    return translations[lang]?.[key] || translations.en?.[key] || key;
  };

  const getLanguage = () => document.documentElement.lang || localStorage.getItem("api-lx-language") || "en";
  const getCountryLabel = (point) => {
    try {
      const displayNames = typeof Intl !== "undefined" && Intl.DisplayNames
        ? new Intl.DisplayNames([getLanguage(), "en"], { type: "region" })
        : null;
      return displayNames?.of(point.iso) || point.country;
    } catch {
      return point.country;
    }
  };
  const getClientLabel = (count) => translate("map_tooltip_clients").replace("{count}", count);
  const getPointClientLabel = (point) => {
    if (point.clientLabelKey) return translate(point.clientLabelKey);
    return getClientLabel(point.clients);
  };
  const getTooltipClientLabel = (point) => {
    if (point.tooltipKey) return translate(point.tooltipKey).replace("{count}", point.clients);
    return getPointClientLabel(point);
  };
  const renderRegionList = () => {
    if (!regionList) {
      regionRows = Array.from(document.querySelectorAll("[data-region-country]"));
      return;
    }
    regionList.replaceChildren();
    clientPoints.forEach((point) => {
      const row = document.createElement("li");
      row.dataset.regionCountry = point.country;
      const country = document.createElement("strong");
      country.textContent = getCountryLabel(point);
      const clients = document.createElement("span");
      clients.textContent = getPointClientLabel(point);
      row.append(country, clients);
      regionList.append(row);
    });
    regionRows = Array.from(regionList.querySelectorAll("[data-region-country]"));
  };

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
  const chipPink = "#B41478";
  const chipPinkDark = "#65083F";
  const chipPinkLight = "#D83A9B";

  const polygonCentroid = (polygon) => {
    const coordinates = polygon?.geometry?.coordinates;
    const ring = polygon?.geometry?.type === "MultiPolygon" ? coordinates?.[0]?.[0] : coordinates?.[0];
    if (!Array.isArray(ring) || !ring.length) return { lat: 0, lng: 0 };
    const total = ring.reduce((acc, pair) => ({ lng: acc.lng + pair[0], lat: acc.lat + pair[1] }), { lat: 0, lng: 0 });
    return { lat: total.lat / ring.length, lng: total.lng / ring.length };
  };

  const ringArea = (ring) => {
    if (!Array.isArray(ring) || ring.length < 3) return 0;
    const averageLat = ring.reduce((sum, pair) => sum + pair[1], 0) / ring.length;
    const latScale = Math.cos(averageLat * Math.PI / 180);
    let area = 0;
    for (let index = 0; index < ring.length; index += 1) {
      const current = ring[index];
      const next = ring[(index + 1) % ring.length];
      area += (current[0] * latScale) * next[1] - (next[0] * latScale) * current[1];
    }
    return Math.abs(area) / 2;
  };

  const polygonArea = (polygon) => {
    const coordinates = polygon?.geometry?.coordinates;
    if (!Array.isArray(coordinates)) return 0;
    if (polygon.geometry?.type === "MultiPolygon") {
      return coordinates.reduce((sum, polygonRings) => sum + ringArea(polygonRings?.[0]), 0);
    }
    return ringArea(coordinates[0]);
  };

  const updatePointDotScales = (polygons) => {
    const activeAreas = polygons
      .map((polygon) => ({ country: getPolygonCountry(polygon), area: polygonArea(polygon) }))
      .filter(({ country, area }) => activeCountryNames.has(country) && area > 0);
    const logAreas = activeAreas.map(({ area }) => Math.log1p(area));
    const minArea = Math.min(...logAreas);
    const maxArea = Math.max(...logAreas);
    const areaByCountry = new Map(activeAreas.map(({ country, area }) => [country, Math.log1p(area)]));

    clientPoints.forEach((point) => {
      if (Number.isFinite(point.fixedDotScale)) {
        point.dotScale = point.fixedDotScale;
        return;
      }
      const logArea = areaByCountry.get(point.country);
      if (!Number.isFinite(logArea) || !Number.isFinite(minArea) || maxArea <= minArea) {
        point.dotScale = 1.1;
        return;
      }
      const normalized = (logArea - minArea) / (maxArea - minArea);
      point.dotScale = 0.82 + Math.pow(normalized, 0.72) * 2.45;
    });
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

  const pointLogoColor = (point) => {
    void point;
    return chipPink;
  };

  const createPokerChipTexture = () => {
    if (pokerChipTexture) return pokerChipTexture;

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const center = 64;
    const outerRadius = 43;
    const innerRadius = 25;
    const slotRadius = 35;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = chipPink;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let index = 0; index < 8; index += 1) {
      const start = index * Math.PI / 4 - 0.16;
      const end = start + 0.32;
      ctx.fillStyle = index % 2 === 0 ? chipPinkLight : chipPinkDark;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, outerRadius, start, end);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = chipPinkDark;
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = chipPink;
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 188, 224, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(center, center, slotRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = chipPinkDark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(center, center, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 188, 224, 0.62)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius - 2, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    pokerChipTexture = texture;
    return pokerChipTexture;
  };

  const createNeonDotTexture = () => {
    if (neonDotTexture) return neonDotTexture;

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const center = 64;
    const glow = ctx.createRadialGradient(center, center, 18, center, center, 58);
    glow.addColorStop(0, "rgba(255, 0, 184, 1)");
    glow.addColorStop(0.42, "rgba(255, 20, 157, 0.72)");
    glow.addColorStop(0.78, "rgba(84, 210, 255, 0.22)");
    glow.addColorStop(1, "rgba(255, 20, 157, 0)");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(center, center, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff00b8";
    ctx.beginPath();
    ctx.arc(center, center, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 124, 222, 0.96)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(center, center, 25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 162, 230, 0.62)";
    ctx.beginPath();
    ctx.arc(54, 52, 6, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    neonDotTexture = texture;
    return neonDotTexture;
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
    return !hasWebGL();
  };

  const waitForMountReady = async () => {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const mountRect = mount.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const hasUsableSize = mountRect.width >= 160
        && mountRect.height >= 160
        && shellRect.width >= 160
        && shellRect.height >= 160;

      if (hasUsableSize) {
        await nextFrame();
        return true;
      }

      await nextFrame();
    }

    return false;
  };

  const loadScript = (src) => {
    if (pendingScriptLoads.has(src)) return pendingScriptLoads.get(src);

    const scriptLoad = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = versionedAssetUrl(src);
      script.async = true;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      script.dataset.apiLxGlobeSrc = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    }).finally(() => pendingScriptLoads.delete(src));

    pendingScriptLoads.set(src, scriptLoad);
    return scriptLoad;
  };

  const loadCdnLibrary = async ({ name, globalName, urls }) => {
    if (window[globalName]) return;
    let lastError;
    for (const url of urls) {
      try {
        await loadScript(url);
        if (window[globalName]) return;
        lastError = new Error(`${name} did not expose window.${globalName}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`Unable to load ${name} from CDN`);
  };

  const loadGlobeLibraries = async () => {
    for (const library of globeLibraries) {
      await loadCdnLibrary(library);
    }
  };

  const fetchFirstJson = async (urls) => {
    let lastError;
    for (const url of urls) {
      try {
        const response = await fetch(versionedAssetUrl(url), { cache: "reload", mode: "cors" });
        if (!response.ok) throw new Error(`Unable to load ${url}`);
        const payload = await response.json();
        if (!payload || typeof payload !== "object") throw new Error(`Invalid JSON from ${url}`);
        return payload;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Unable to load JSON from CDN");
  };

  const fetchWorldPolygons = async () => {
    return retry(async () => {
      const topology = await fetchFirstJson(worldAtlasUrls);
      if (!topology?.objects?.countries) throw new Error("World atlas is missing country data");
      const geoJson = window.topojson?.feature(topology, topology.objects.countries);
      if (!Array.isArray(geoJson?.features) || !geoJson.features.length) {
        throw new Error("World atlas did not produce country polygons");
      }
      return geoJson.features;
    }, 3, 420);
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
    tooltip.innerHTML = `<strong>${getCountryLabel(point)}</strong><span> &mdash; ${getTooltipClientLabel(point)}</span>`;
    if (position) {
      tooltip.style.left = `${position.x}px`;
      tooltip.style.top = `${position.y}px`;
    }
  };

  const setRegionHighlight = (country = "") => {
    regionRows.forEach((row) => {
      row.classList.toggle("active", row.dataset.regionCountry === country);
    });
    webglMarkers.forEach(({ point, marker, baseScale }) => {
      const isActive = point.country === country;
      marker.material.opacity = isActive ? 1 : 0.95;
      marker.scale.setScalar(baseScale * (isActive ? 1.08 : 1));
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
      .pointColor((point) => point.country === activeCountry ? "rgba(255, 255, 255, 0.98)" : pointLogoColor(point));
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

  const createWebglMarkers = () => {
    const dotTexture = createNeonDotTexture();
    if (!dotTexture) {
      webglMarkers = [];
      return;
    }

    const dotGeometry = new THREE.CircleGeometry(1, 32);
    const surfaceNormal = new THREE.Vector3(0, 0, 1);

    webglMarkers = clientPoints.map((point, index) => {
      const material = new THREE.MeshBasicMaterial({
        map: dotTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const marker = new THREE.Mesh(dotGeometry, material);
      const coords = typeof globe.getCoords === "function"
        ? globe.getCoords(point.lat, point.lng, MARKER_ALTITUDE)
        : { x: 0, y: 0, z: 0 };
      marker.position.set(coords.x, coords.y, coords.z);
      marker.quaternion.setFromUnitVectors(surfaceNormal, marker.position.clone().normalize());
      marker.renderOrder = 12;
      marker.scale.setScalar(point.dotScale || 1.1);
      marker.userData.point = point;
      marker.userData.phase = index * 0.63;
      globe.add(marker);
      return { point, marker, baseScale: marker.scale.x };
    });
  };

  const updateWebglMarkers = (time) => {
    const worldPosition = new THREE.Vector3();
    webglMarkers.forEach(({ marker, baseScale }) => {
      marker.getWorldPosition(worldPosition);
      const pulse = 1 + Math.sin(time * 0.0032 + marker.userData.phase) * 0.035;
      marker.visible = worldPosition.z > 8;
      if (marker.visible && marker.userData.point.country !== activeCountry) {
        marker.scale.setScalar(baseScale * pulse);
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
    const markers = webglMarkers.map(({ marker }) => marker).filter((marker) => marker.visible);
    const hit = raycaster.intersectObjects(markers, false)[0]?.object;
    if (hit?.userData?.point) {
      setActiveCountry(hit.userData.point.country);
    } else if (activeCountry && !regionRows.some((row) => row.matches(":hover"))) {
      clearActiveCountry();
    }
  };

  const setupRegionRows = () => {
    renderRegionList();
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

  const scheduleResize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resize();
    });
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
    cancelAnimationFrame(resizeFrame);
    frameId = 0;
    resizeFrame = 0;
    wakeupTimers.forEach((timer) => window.clearTimeout(timer));
    wakeupTimers = [];
    wakeListeners.forEach(([target, eventName, handler]) => target.removeEventListener(eventName, handler));
    wakeListeners = [];
    window.clearInterval(animationWatchdog);
    animationWatchdog = 0;
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    if (onDocumentVisibilityChange) {
      document.removeEventListener("visibilitychange", onDocumentVisibilityChange);
      onDocumentVisibilityChange = null;
    }
    pointerListeners.forEach(([eventName, handler]) => shell.removeEventListener(eventName, handler));
    window.removeEventListener("beforeunload", cleanup);
    hideTooltip();
    disposeObject(scene);
    renderer?.dispose?.();
    renderer?.forceContextLoss?.();
    webglMarkers = [];
    mount.replaceChildren();
  };

  window.addEventListener("api-lx-language-change", () => {
    const active = activeCountry;
    renderRegionList();
    setupRegionRows();
    setRegionHighlight(active);
  });

  const initGlobe = async () => {
    setupRegionRows();
    if (shouldUseFallback()) {
      showFallback();
      return;
    }

    if (!await waitForMountReady()) {
      console.warn("[api-lx-globe] Globe container did not receive a usable size, using fallback globe.");
      showFallback();
      return;
    }

    try {
      await retry(loadGlobeLibraries, 3, 420);
    } catch (error) {
      console.warn("[api-lx-globe] CDN globe libraries unavailable, using fallback globe.", error);
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
      updatePointDotScales(polygons);
    } catch (error) {
      console.warn("[api-lx-globe] World polygons unavailable, rendering points only.", error);
    }
    shell.dataset.globePolygons = String(polygons.length);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 1, 1200);
    camera.position.set(0, 0, 330);

    const lowPower = isLowPowerDevice();
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !lowPower && (window.devicePixelRatio || 1) <= 1.5,
        powerPreference: lowPower ? "low-power" : "high-performance"
      });
    } catch (error) {
      console.warn("[api-lx-globe] WebGL renderer unavailable, using fallback globe.", error);
      showFallback();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    const pixelRatioLimit = lowPower ? 1 : (window.innerWidth < 768 ? 1.15 : 1.5);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
    mount.replaceChildren();
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
      .pointsData([])
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude(0)
      .pointRadius(0)
      .pointResolution(24)
      .pointColor(pointLogoColor)
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
      .arcStroke(0.72)
      .arcDashLength(0.58)
      .arcDashGap(2.45)
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
    raycaster.params.Mesh = { threshold: 0.1 };
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
    window.addEventListener("load", scheduleResize, { once: true });
    requestAnimationFrame(() => {
      resize();
      requestAnimationFrame(resize);
    });
    setupDragRotation();

    shell.classList.add("ready");
    if (loading) loading.hidden = true;
    if (fallback) fallback.hidden = true;
    window.addEventListener("beforeunload", cleanup);

    const renderGlobeFrame = (allowRaycast = false) => {
      if (!renderer || !scene || !camera || isDestroyed) return;
      updateWebglMarkers(performance.now());
      if (allowRaycast) raycastMarkers();
      renderer.render(scene, camera);
    };

    const forceRender = () => {
      if (!renderer || !scene || !camera || isDestroyed) return;
      resize();
      renderGlobeFrame(false);
    };

    const isShellVisibleOnScreen = () => {
      const rect = shell.getBoundingClientRect();
      return rect.width > 0
        && rect.height > 0
        && rect.bottom > -220
        && rect.top < window.innerHeight + 220
        && rect.right > 0
        && rect.left < window.innerWidth;
    };

    const queueWarmupRenders = () => {
      wakeupTimers.forEach((timer) => window.clearTimeout(timer));
      wakeupTimers = [];
      [0, 80, 180, 360, 720, 1400].forEach((delay) => {
        const timer = window.setTimeout(() => {
          forceRender();
          if (!document.hidden) {
            const animationIsStale = !lastAnimatedAt || performance.now() - lastAnimatedAt > 500;
            startAnimation(animationIsStale);
          }
        }, delay);
        wakeupTimers.push(timer);
      });
    };

    const animate = (timestamp = performance.now()) => {
      if (isDestroyed || !isDocumentVisible || (!isGlobeInView && !isShellVisibleOnScreen())) {
        frameId = 0;
        return;
      }
      lastAnimatedAt = timestamp;
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
      renderGlobeFrame(true);
      frameId = requestAnimationFrame(animate);
    };

    const startAnimation = (restart = false) => {
      if (isDestroyed || !isDocumentVisible) return;
      if (!isGlobeInView && !isShellVisibleOnScreen()) return;
      if (restart && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      if (frameId) return;
      frameId = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (!frameId) return;
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const updateAnimationState = () => {
      if (isDocumentVisible && (isGlobeInView || isShellVisibleOnScreen())) startAnimation();
      else stopAnimation();
    };

    onDocumentVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      updateAnimationState();
      if (isDocumentVisible) {
        forceRender();
        queueWarmupRenders();
      }
    };
    document.addEventListener("visibilitychange", onDocumentVisibilityChange);

    const wakeGlobe = () => {
      isDocumentVisible = !document.hidden;
      forceRender();
      updateAnimationState();
      queueWarmupRenders();
    };

    [
      [window, "pageshow", wakeGlobe],
      [window, "focus", wakeGlobe],
      [window, "resize", wakeGlobe]
    ].forEach(([target, eventName, handler]) => {
      target.addEventListener(eventName, handler, { passive: true });
      wakeListeners.push([target, eventName, handler]);
    });

    animationWatchdog = window.setInterval(() => {
      if (isDestroyed || document.hidden || (!isGlobeInView && !isShellVisibleOnScreen())) return;
      isDocumentVisible = true;
      const animationIsStale = !frameId || !lastAnimatedAt || performance.now() - lastAnimatedAt > 900;
      if (animationIsStale) startAnimation(true);
    }, 500);

    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        isGlobeInView = Boolean(entry?.isIntersecting);
        updateAnimationState();
        if (isGlobeInView) {
          forceRender();
          queueWarmupRenders();
        }
      }, { rootMargin: "220px 0px", threshold: 0.01 });
      visibilityObserver.observe(shell);
    }

    forceRender();
    updateAnimationState();
    queueWarmupRenders();
  };

  initGlobe();
  window.API_LX_DESTROY_GLOBE = cleanup;
})();
