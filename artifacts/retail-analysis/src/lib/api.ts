// Same-origin: the frontend and the API share a host. nginx on the VM serves
// the app and proxies /api to Flask; myretailguard.com (via Cloudflare) proxies
// /api to that same nginx. Relative URLs work on both and avoid the mixed-content
// block (HTTPS page -> HTTP IP) and the firewalled :8080 port.
export const API_BASE = "";

export async function apiCall(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem("rg-token");
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (res.status === 401) {
    localStorage.removeItem("rg-token");
    window.location.reload();
  }
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (data.ok) {
    localStorage.setItem("rg-token", data.token);
    localStorage.setItem("rg-user", data.name);
  }
  return data;
}

export function isLoggedIn() {
  return !!localStorage.getItem("rg-token");
}

export function logout() {
  localStorage.removeItem("rg-token");
  localStorage.removeItem("rg-user");
  window.location.reload();
}

export function getUser() {
  return localStorage.getItem("rg-user") || "";
}
