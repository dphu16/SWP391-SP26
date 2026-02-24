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
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwt(token: string | null): JwtPayload | null {
  if (!token) return null;

  try {
    // #region agent log
    fetch("http://127.0.0.1:7882/ingest/fefb8f99-cf79-45ff-8e42-7907b7a007d5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "9dee00",
      },
      body: JSON.stringify({
        sessionId: "9dee00",
        runId: "initial",
        hypothesisId: "H1",
        location: "src/utils/jwtDecode.ts:19",
        message: "decodeJwt called",
        data: {
          hasToken: !!token,
          tokenLength: token.length,
          dotCount: token.split(".").length - 1,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const jsonStr = base64UrlDecode(parts[1]);
    const payload = JSON.parse(jsonStr) as JwtPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // #region agent log
      fetch("http://127.0.0.1:7882/ingest/fefb8f99-cf79-45ff-8e42-7907b7a007d5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "9dee00",
        },
        body: JSON.stringify({
          sessionId: "9dee00",
          runId: "initial",
          hypothesisId: "H2",
          location: "src/utils/jwtDecode.ts:31",
          message: "JWT expired",
          data: {
            exp: payload.exp,
            nowSeconds: Math.floor(Date.now() / 1000),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
      return null;
    }

    return payload;
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7882/ingest/fefb8f99-cf79-45ff-8e42-7907b7a007d5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "9dee00",
      },
      body: JSON.stringify({
        sessionId: "9dee00",
        runId: "initial",
        hypothesisId: "H3",
        location: "src/utils/jwtDecode.ts:40",
        message: "decodeJwt threw",
        data: {
          errorMessage: err instanceof Error ? err.message : String(err),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    return null;
  }
}

