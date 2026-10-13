import { corsHeaders } from './cors.ts';

export class HttpError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(err: unknown, fallbackStatus = 400): Response {
  const status = err instanceof HttpError ? err.status : fallbackStatus;
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  const code = err instanceof HttpError ? err.code : undefined;

  console.error(`[EdgeFunction Error ${status}]:`, message);

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      ...(code ? { code } : {}),
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
