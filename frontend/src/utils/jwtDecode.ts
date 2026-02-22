export interface JwtPayload {
  sub: string;
  role?: string;
  fullName?: string;
  employeeId?: string;
  avatarUrl?: string;
  iat?: number;
  exp?: number;
}

export function decodeJwt(token: string | null): JwtPayload | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr) as JwtPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
