"use strict";

function createMockLaunchUrl(payload) {
  const params = new URLSearchParams({
    gameId: payload.gameId,
    provider: payload.provider,
    currency: payload.currency,
    language: payload.language,
    sessionId: payload.guestSessionId
  });

  return `https://example.com/api-lx/mock-launch/pragmatic/${encodeURIComponent(payload.gameId)}?${params.toString()}`;
}

async function createLaunchSession(payload) {
  // Future Pragmatic Play integration point:
  // Replace this mock response with the real provider launch request.
  return {
    launch_url: createMockLaunchUrl(payload),
    provider: "pragmatic",
    gameId: payload.gameId,
    guestSessionId: payload.guestSessionId,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };
}

module.exports = {
  createLaunchSession
};
