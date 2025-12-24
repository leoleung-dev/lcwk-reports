const storeKey = "__lcwkRateLimitStore";

function getStore() {
  if (!globalThis[storeKey]) {
    globalThis[storeKey] = new Map();
  }
  return globalThis[storeKey];
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

export function rateLimit(request, options = {}) {
  const {
    limit = 120,
    windowMs = 60_000,
    keyPrefix = "api",
  } = options;

  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const store = getStore();

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      resetAt,
      retryAfter: 0,
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;

  return {
    allowed: true,
    remaining: Math.max(limit - entry.count, 0),
    resetAt: entry.resetAt,
    retryAfter: 0,
  };
}
