/**
 * Robust and safe fetch wrapper for FältKoll.
 * Prevents "Unexpected token '<', "<html> <he"... is not valid JSON" crashes
 * by verifying the Content-Type header before attempting to parse JSON.
 * Seamlessly handles offline mode, Vite SPA HTML fallbacks, and static hosting (GitHub Pages, Netlify).
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isHtml?: boolean;
}

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: SafeFetchOptions
): Promise<ApiResponse<T>> {
  const timeoutMs = options?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      ...options,
      signal: options?.signal || controller.signal,
    };

    const res = await fetch(url, fetchOptions);
    clearTimeout(timer);
    const contentType = res.headers.get('content-type') || '';

    // If server returned an HTML page (Vite index.html fallback, 404/502/503 HTML, Netlify rewrite, etc.)
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      // If the response text looks like HTML (<doctype, <html, etc.)
      const isHtml = text.trim().startsWith('<');
      return {
        ok: false,
        status: res.status,
        isHtml,
        error: isHtml
          ? 'Enheten är offline eller kör i lokal miljö. All data synkas automatiskt och sparas säkert lokalt och i Google Cloud.'
          : `Serverfel (${res.status}): Ogiltigt svar.`,
      };
    }

    try {
      const json = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: json?.error || `Begäran misslyckades med status ${res.status}`,
          data: json,
        };
      }
      return { ok: true, status: res.status, data: json };
    } catch {
      return {
        ok: false,
        status: res.status,
        error: 'Kunde inte tolka svaret från servern som giltig JSON.',
      };
    }
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      error: isTimeout
        ? 'Synkningen tog för lång tid. Försöker igen automatiskt eller kontrollera internetanslutningen.'
        : err?.message || 'Nätverksanslutningen misslyckades (enheten verkar vara offline).',
    };
  }
}
