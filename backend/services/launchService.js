"use strict";

const pragmatic = require("../providers/pragmatic");
const pgsoft = require("../providers/pgsoft");
const evolution = require("../providers/evolution");

const providerAdapters = {
  pragmatic,
  pgsoft,
  evolution,
  // Temporary mapping until a dedicated Amusnet adapter is added.
  amusnet: pragmatic
};

const REQUIRED_FIELDS = ["gameId", "provider", "currency", "language", "guestSessionId"];

function normalizeLaunchPayload(payload) {
  return {
    gameId: payload.gameId.trim(),
    provider: payload.provider.trim().toLowerCase(),
    currency: payload.currency.trim().toUpperCase(),
    language: payload.language.trim().toLowerCase(),
    guestSessionId: payload.guestSessionId.trim()
  };
}

function validateLaunchPayload(payload) {
  const missingFields = REQUIRED_FIELDS.filter((field) => typeof payload[field] !== "string" || !payload[field].trim());

  if (missingFields.length) {
    return `Missing required field(s): ${missingFields.join(", ")}`;
  }

  return null;
}

async function createDemoLaunch(payload) {
  const validationError = validateLaunchPayload(payload);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const normalizedPayload = normalizeLaunchPayload(payload);
  const adapter = providerAdapters[normalizedPayload.provider];

  if (!adapter) {
    const error = new Error(`Unsupported provider: ${normalizedPayload.provider}`);
    error.statusCode = 400;
    throw error;
  }

  const launchSession = await adapter.createLaunchSession(normalizedPayload);

  return {
    status: "ok",
    mode: "mock",
    ...launchSession
  };
}

module.exports = {
  createDemoLaunch,
  validateLaunchPayload,
  normalizeLaunchPayload
};
