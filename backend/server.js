"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { createDemoLaunch } = require("./services/launchService");

loadEnvFile(path.join(__dirname, "..", ".env"));
loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 8787);
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://evduch.github.io"
];
const ALLOWED_ORIGINS = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) return;

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  });
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(req, res, statusCode, payload) {
  setCorsHeaders(req, res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error("Request body is too large"));
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "";
}

function validateLeadPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Invalid lead payload";
  }

  const requiredFields = ["name", "telegramId", "whatsappNumber", "leadType", "pageUrl", "language", "createdAt"];
  if (payload.leadType !== "Referral partner") {
    requiredFields.push("source", "message", "stage", "launchTiming", "projectType", "countries", "activeProjects", "ggr");
  }

  const missingField = requiredFields.find((field) => !String(payload[field] || "").trim());
  if (missingField) return `Missing required field: ${missingField}`;

  if (payload.privacyConsent !== true) {
    return "Privacy Policy consent is required";
  }

  return "";
}

async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    const error = new Error("Turnstile secret key is not configured");
    error.statusCode = 500;
    throw error;
  }

  if (!token) return false;

  const body = new URLSearchParams({
    secret,
    response: token
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body
  });

  if (!response.ok) {
    const error = new Error("Unable to verify Turnstile token");
    error.statusCode = 502;
    throw error;
  }

  const result = await response.json();
  if (!result.success) {
    const errorCodes = Array.isArray(result["error-codes"]) ? result["error-codes"].join(", ") : "";
    const error = new Error(errorCodes ? `Turnstile verification failed: ${errorCodes}` : "Turnstile verification failed");
    error.statusCode = 403;
    throw error;
  }

  return true;
}

async function forwardLeadToGoogleSheets(payload) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    const error = new Error("Google Sheets webhook URL is not configured");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const responseText = await response.text();

  if (!response.ok) {
    const error = new Error(responseText || "Google Sheets webhook request failed");
    error.statusCode = 502;
    throw error;
  }

  return responseText;
}

async function handleDemoLaunch(req, res) {
  const payload = await readJsonBody(req);
  const launchSession = await createDemoLaunch(payload);
  sendJson(req, res, 200, launchSession);
}

async function handleProviderCallback(req, res) {
  const payload = await readJsonBody(req);

  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.keys(payload).length === 0) {
    sendJson(req, res, 400, { error: "Missing callback payload" });
    return;
  }

  const callbackLog = {
    callbackType: payload.type || payload.callbackType || payload.event || "unknown",
    playerId: payload.playerId || payload.player_id || payload.userId || null,
    sessionId: payload.sessionId || payload.session_id || payload.guestSessionId || null,
    transactionId: payload.transactionId || payload.transaction_id || payload.txId || null,
    amount: payload.amount ?? null,
    currency: payload.currency || null,
    gameId: payload.gameId || payload.game_id || null
  };

  // TODO: Verify provider request signature before trusting callback data.
  // TODO: Load and lock player/session wallet balance before processing.
  // TODO: Implement bet, win, refund, and rollback transaction flows.
  // TODO: Add idempotency checks for provider transaction IDs.
  // TODO: Persist callback payload and processing result for audit/reconciliation.
  console.log("[provider-callback]", JSON.stringify(callbackLog));

  sendJson(req, res, 200, {
    status: "ok",
    mode: "mock",
    accepted: true,
    balance: null,
    transactionId: callbackLog.transactionId
  });
}

async function handleLead(req, res) {
  const payload = await readJsonBody(req);

  if (String(payload.company_website || "").trim()) {
    sendJson(req, res, 202, { ok: true });
    return;
  }

  const validationError = validateLeadPayload(payload);
  if (validationError) {
    sendJson(req, res, 400, { error: validationError });
    return;
  }

  const isHuman = await verifyTurnstileToken(payload.turnstileToken, getClientIp(req));
  if (!isHuman) {
    sendJson(req, res, 403, { error: "Turnstile verification failed" });
    return;
  }

  const leadPayload = { ...payload };
  delete leadPayload.turnstileToken;
  delete leadPayload.company_website;
  await forwardLeadToGoogleSheets(leadPayload);
  sendJson(req, res, 200, { ok: true });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/demo-launch") {
    try {
      await handleDemoLaunch(req, res);
    } catch (error) {
      sendJson(req, res, error.statusCode || 500, {
        error: error.statusCode ? error.message : "Unable to create demo launch session",
        details: error.statusCode ? undefined : error.message
      });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/lead") {
    try {
      await handleLead(req, res);
    } catch (error) {
      sendJson(req, res, error.statusCode || 500, {
        error: error.statusCode ? error.message : "Unable to submit lead",
        details: error.statusCode ? undefined : error.message
      });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/provider/callback") {
    try {
      await handleProviderCallback(req, res);
    } catch (error) {
      sendJson(req, res, 500, {
        error: "Unable to process provider callback",
        details: error.message
      });
    }
    return;
  }

  sendJson(req, res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`API LX demo launch backend running at http://127.0.0.1:${PORT}`);
});
