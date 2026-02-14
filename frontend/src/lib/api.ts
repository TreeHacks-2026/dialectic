const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  try {
    const resp = await fetch(`${API_BASE}${path}`, options);
    const data = await resp.json();
    if (!resp.ok) {
      return { ok: false, data, error: data.error || data.detail || JSON.stringify(data) };
    }
    return { ok: true, data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, data: null, error: message };
  }
}
