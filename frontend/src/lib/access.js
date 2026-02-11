// Access control helpers (frontend)
//
// Configure allowlisted emails via environment:
//   REACT_APP_ALLOWED_EMAILS="a@x.com,b@y.com"
// If unset, no one is allowlisted.

export function getAllowedEmails() {
  const raw = process.env.REACT_APP_ALLOWED_EMAILS || '';
  return raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowlisted(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;
  const allowed = getAllowedEmails();
  return allowed.includes(e);
}

export function hasPaidAccess({ user, shop }) {
  const allowlisted = isEmailAllowlisted(user?.email);
  const status = String(shop?.subscription_status || '').toLowerCase();

  // Accept either old scheme: 'active'
  // or plan-based scheme: 'starter' | 'pro' | 'super'
  const paid = status === 'active' || status === 'starter' || status === 'pro' || status === 'super';

  return allowlisted || paid;
}
