export interface JwtPayload {
 sub: string;
 role?: string;
 fullName?: string;
 employeeId?: string;
 avatarUrl?: string;
 iat?: number;
 exp?: number;
}

function base64UrlDecode(str: string): string {
 const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
 const padded = base64.padEnd(
 base64.length + ((4 - (base64.length % 4)) % 4),
 "=",
 );
 const binary = atob(padded);
 const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
 return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwt(token: string | null): JwtPayload | null {
 if (!token) return null;

 try {
 const parts = token.split(".");
 if (parts.length !== 3) return null;

 const jsonStr = base64UrlDecode(parts[1]);
 const payload = JSON.parse(jsonStr) as JwtPayload;
 if (payload.exp && payload.exp * 1000 < Date.now()) {
 return null;
 }

 return payload;
 } catch {
 return null;
 }
}
