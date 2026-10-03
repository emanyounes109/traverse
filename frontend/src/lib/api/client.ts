export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: string[];

  constructor(statusCode: number, code: string, message: string, details?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;       // JSON
  formData?: FormData;  
  query?: Query;
}

const BASE = "/api/v1";

function buildQuery(query?: Query) {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

const NO_REDIRECT_ON_401 = ["/auth/login", "/auth/register", "/auth/me"];

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, query } = opts;

  const res = await fetch(`${BASE}${path}${buildQuery(query)}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      !NO_REDIRECT_ON_401.includes(path)
    ) {
      window.location.href = "/login";
    }
    throw new ApiError(
      res.status,
      data?.code ?? "UNKNOWN_ERROR",
      data?.message ?? "Something went wrong",
      data?.details
    );
  }

  return data as T;
}