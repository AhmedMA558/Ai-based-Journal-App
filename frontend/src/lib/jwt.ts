export interface JwtPayload {
  userId?: number;
  roles?: string[];
  [key: string]: unknown;
}

// Decodes a JWT's payload segment without verifying its signature - never a
// security boundary (the server's @PreAuthorize is), purely a UX read of
// claims (roles, userId) already embedded by AuthServiceImpl at issuance.
// Fails soft on any malformed/missing token instead of throwing.
export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
