import { query } from "./db";

function normalizeEmail(email) {
  if (!email) {
    return "";
  }
  return String(email).trim().toLowerCase();
}

function parseEmailList(value) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

const fallbackEmails = parseEmailList(process.env.AUTHORIZED_EMAILS);

export function getFallbackEmails() {
  return fallbackEmails.slice();
}

export async function isEmailAllowed(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  if (fallbackEmails.includes(normalized)) {
    return true;
  }

  try {
    const rows = await query(
      "SELECT 1 FROM allowed_emails WHERE email = $1 LIMIT 1",
      [normalized]
    );
    return rows.length > 0;
  } catch (error) {
    return fallbackEmails.includes(normalized);
  }
}

export async function listAllowedEmails() {
  const rows = await query(
    "SELECT id, email, added_by AS \"addedBy\", created_at AS \"createdAt\" FROM allowed_emails ORDER BY created_at DESC"
  );
  return rows;
}

export async function addAllowedEmail(email, addedBy) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error("Email is required.");
  }

  const rows = await query(
    `INSERT INTO allowed_emails (email, added_by)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET added_by = EXCLUDED.added_by
     RETURNING id, email, added_by AS "addedBy", created_at AS "createdAt"`,
    [normalized, addedBy || null]
  );
  return rows[0];
}

export async function removeAllowedEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error("Email is required.");
  }
  await query("DELETE FROM allowed_emails WHERE email = $1", [normalized]);
  return normalized;
}

export function normalizeAllowedEmail(email) {
  return normalizeEmail(email);
}
