const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const REMEMBER_ME_KEY = "remember_me";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Email hoặc mật khẩu không chính xác.";
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json() as Promise<LoginResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
  }

  return res.json() as Promise<LoginResponse>;
}

export function saveToken(token: string): void {
  // Always store access token in localStorage so it survives page reloads.
  // The refresh token storage (localStorage vs sessionStorage) controls
  // whether the session survives browser close.
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("auth-change"));
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  return token;
}

export function saveRefreshToken(token: string, persist: boolean): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);

  // Remember the persistence preference so the interceptor can re-save
  // tokens correctly after a refresh cycle.
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(REMEMBER_ME_KEY);

  if (persist) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_ME_KEY, "true");
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    sessionStorage.setItem(REMEMBER_ME_KEY, "false");
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(REMEMBER_ME_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
