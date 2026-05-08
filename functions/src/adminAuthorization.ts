export const DEFAULT_ADMIN_EMAIL = 'zqhablly@gmail.com';

export const ADMIN_ROLES = ['admin', 'operator', 'finance', 'reviewer', 'support'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminIdentityInput = {
  uid?: string | null;
  email?: string | null;
  token?: Record<string, unknown> | null;
  allowedEmails?: string[];
};

export function allowedAdminEmails(value = process.env.ADMIN_ALLOWED_EMAILS || DEFAULT_ADMIN_EMAIL): string[] {
  return String(value)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeAdminRole(value: unknown): AdminRole {
  const role = String(value || '').trim().toLowerCase();
  return ADMIN_ROLES.includes(role as AdminRole) ? role as AdminRole : 'admin';
}

export function buildAdminCustomClaims(role: unknown): {admin: true; adminRole: AdminRole} {
  return {
    admin: true,
    adminRole: normalizeAdminRole(role),
  };
}

export function isAdminIdentity(input: AdminIdentityInput): boolean {
  if (!input.uid) return false;

  const email = String(input.email || '').trim().toLowerCase();
  const token = input.token ?? {};
  const allowedEmails = input.allowedEmails ?? allowedAdminEmails();
  const tokenRole = String(token.adminRole || token.role || '').trim().toLowerCase();

  return (
    allowedEmails.includes(email) ||
    token.admin === true ||
    ADMIN_ROLES.includes(tokenRole as AdminRole)
  );
}

export function adminRoleForIdentity(input: AdminIdentityInput, userRole?: string): AdminRole | 'owner' {
  const email = String(input.email || '').trim().toLowerCase();
  const allowedEmails = input.allowedEmails ?? allowedAdminEmails();
  if (allowedEmails.includes(email)) return 'owner';

  const tokenRole = String(input.token?.adminRole || input.token?.role || '').trim().toLowerCase();
  if (ADMIN_ROLES.includes(tokenRole as AdminRole)) return tokenRole as AdminRole;

  return normalizeAdminRole(userRole);
}
