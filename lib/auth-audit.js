import { query } from "./db";

function normalizeEmail(email) {
  if (!email) {
    return null;
  }
  return String(email).trim().toLowerCase();
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "allowed" || value === "denied") {
    return value;
  }
  return "denied";
}

export async function recordAuthAttempt({ email, status, provider, reason }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedStatus = normalizeStatus(status);
  const normalizedProvider = provider ? String(provider) : null;
  const normalizedReason = reason ? String(reason) : null;

  await query(
    `INSERT INTO auth_audit (email, status, provider, reason)
     VALUES ($1, $2, $3, $4)`,
    [normalizedEmail, normalizedStatus, normalizedProvider, normalizedReason]
  );
}

export async function listAuthAttempts(limit = 50) {
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(limit, 1), 200)
    : 50;

  const rows = await query(
    `SELECT id, email, status, provider, reason, created_at AS "createdAt"
     FROM auth_audit
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return rows;
}
