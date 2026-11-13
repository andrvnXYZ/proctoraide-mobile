/**
 * The Laravel API base URL. It is injected at build time from
 * EXPO_PUBLIC_API_URL (see eas.json). The production APK must point at the
 * deployed Railway backend, so there is deliberately no localhost fallback in
 * the shipped bundle. For local development create .env.local with
 * EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api (Android emulator: 10.0.2.2).
 */
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl ?? '').replace(/\/$/, '');

export const isApiConfigured = API_BASE_URL.length > 0;


export class ApiError extends Error {
  status: number;

  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError(
      'This build is missing EXPO_PUBLIC_API_URL. Rebuild with the Railway API URL configured.',
      0,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const payload = text ? safeParse(text) : null;

    if (!response.ok) {
      let message = `Request failed (${response.status}).`;

      if (payload && typeof payload === 'object' && 'message' in payload) {
        const serverMessage = (payload as { message?: unknown }).message;

        if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
          message = serverMessage;
        }
      }

      throw new ApiError(message, response.status, (payload as { errors?: Record<string, string[]> })?.errors);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Check your connection and try again.', 0);
    }

    throw new ApiError('Cannot reach the ProctorAide server. Check that the backend is running.', 0);
  } finally {
    clearTimeout(timeout);
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
