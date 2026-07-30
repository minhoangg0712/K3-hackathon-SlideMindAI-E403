/**
 * Wrapper fetch tương ứng cặp hàm `apiUrl` / `apiFetch` của bản gốc:
 * mọi call đi qua prefix proxy `/api/backend` rồi tới path `/api/v1/...`.
 * Giữ đúng hình dạng này để có thể trỏ sang backend thật chỉ bằng env var.
 */

export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/backend";

export function apiUrl(path: string): string {
  return `${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
}

/** Trích message lỗi từ response, ưu tiên field `detail` như backend thật. */
export async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.message === "string") return body.message;
  } catch {
    /* body không phải JSON */
  }
  return `HTTP ${res.status}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}
